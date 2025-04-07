import { NextResponse } from "next/server"
import { chromium } from "playwright-core"
import type { SearchResult, WebsiteContent } from "@/lib/crawler-service"

const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2秒

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function scrapeWebsiteContent(page: any, url: string): Promise<WebsiteContent> {
  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000
  })

  // 等待页面完全加载
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(2000) // 额外等待2秒确保动态内容加载

  // 获取页面标题
  const title = await page.title()

  // 获取页面主要内容
  const content = await page.evaluate(() => {
    // 移除干扰元素
    const removeElements = (selectors: string[]) => {
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove())
      })
    }
    
    removeElements([
      'script',
      'style',
      'iframe',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ad',
      '#ad',
      '.banner',
      '.popup',
      '.modal'
    ])

    // 获取主要内容区域
    const mainContent = document.querySelector('main, article, .content, #content, .main, #main')
    
    // 获取所有文章链接和标题
    const articles = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/article/"], a[href*="/news/"]'))
      .map(link => {
        const href = link.getAttribute('href')
        // 确保链接是完整的URL
        const fullUrl = href?.startsWith('http') ? href : new URL(href || '', window.location.origin).href
        // 获取文章标题和简介
        const title = link.textContent?.trim() || ''
        const description = link.closest('div, article')?.textContent?.trim() || ''
        
        return {
          title,
          url: fullUrl,
          description: description.replace(title, '').trim() // 移除标题，保留描述
        }
      })
      .filter(article => article.title && article.url && !article.url.includes('#'))
      .slice(0, 10) // 限制最多10篇文章

    // 获取网站介绍
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''
    
    // 获取主要导航栏信息
    const navigation = Array.from(document.querySelectorAll('nav a, header a'))
      .map(link => link.textContent?.trim())
      .filter(Boolean)
      .slice(0, 10)
      .join(', ')

    // 获取主要内容文本
    const mainText = mainContent ? mainContent.textContent
      ?.replace(/[\n\r]+/g, '\n')
      .replace(/\s+/g, ' ')
      .trim() : ''

    return {
      description,
      keywords,
      navigation,
      mainText,
      articles
    }
  })

  return {
    title,
    content: JSON.stringify(content),
    url
  }
}

export async function POST(request: Request) {
  let browser: any = null
  let context: any = null
  
  try {
    const { keyword, type = "search" } = await request.json()
    console.log("爬虫API - 开始爬取内容:", { keyword, type })

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (browser) {
          await browser.close()
        }

        browser = await chromium.connectOverCDP("http://localhost:9222")
        console.log(`爬虫API - 第 ${attempt} 次尝试连接Chrome成功`)

        context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 }
        })
        
        const page = await context.newPage()
        console.log("爬虫API - 创建新页面成功")
        
        // 设置超时时间
        page.setDefaultTimeout(30000)
        page.setDefaultNavigationTimeout(30000)

        if (type === "website") {
          // 直接爬取网站内容
          console.log("爬虫API - 准备访问网站:", keyword)
          const content = await scrapeWebsiteContent(page, keyword)
          console.log("爬虫API - 成功爬取网站内容:", {
            hasTitle: !!content.title,
            contentLength: content.content.length,
            url: content.url
          })
          return NextResponse.json(content)
        } else {
          // 搜索并爬取内容
          const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(keyword)}`
          console.log("爬虫API - 准备访问搜索页面:", searchUrl)
          
          await page.goto(searchUrl, {
            waitUntil: 'networkidle',
            timeout: 30000
          })
          
          console.log("爬虫API - 页面加载完成")

          // 等待搜索结果加载
          await page.waitForSelector("main > ol > li", { timeout: 10000 })
          
          // 获取搜索结果
          const results: SearchResult[] = []
          const searchResults = await page.$$("main > ol > li")
          console.log("爬虫API - 找到搜索结果数量:", searchResults.length)
          
          for (const result of searchResults.slice(0, 5)) {
            const titleElement = await result.$("h2")
            const contentElement = await result.$(".b_caption p")
            const linkElement = await result.$("h2 a")

            if (titleElement && contentElement && linkElement) {
              const title = await titleElement.textContent() || ""
              const content = await contentElement.textContent() || ""
              const url = await linkElement.getAttribute("href") || ""

              if (title && content && url) {
                results.push({ title, content, url })
              }
            }
          }
          
          console.log("爬虫API - 成功提取搜索结果:", results.length)
          await context.close()
          await browser.close()
          console.log("爬虫API - 浏览器已关闭")
          
          return NextResponse.json(results)
        }
      } catch (error) {
        console.error(`爬虫API - 第 ${attempt} 次尝试失败:`, error)
        
        if (attempt < MAX_RETRIES) {
          console.log(`爬虫API - 等待 ${RETRY_DELAY}ms 后重试...`)
          await delay(RETRY_DELAY)
          continue
        }
        
        throw error
      } finally {
        if (context) {
          await context.close()
        }
        if (browser) {
          await browser.close()
        }
        console.log("爬虫API - 浏览器已关闭")
      }
    }
  } catch (error) {
    console.error("爬虫API错误:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "爬取内容失败，请确保：\n1. Chrome 已在远程调试模式下运行\n2. 网络连接正常\n3. 目标网站可以正常访问" 
      },
      { status: 500 }
    )
  }
} 