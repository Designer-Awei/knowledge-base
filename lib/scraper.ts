"use server"

import { chromium, type Browser } from "playwright"

export interface ScrapingResult {
  title: string
  content: string
  url: string
  timestamp: string
}

/**
 * Scrapes content from a specified URL
 * @param url The URL to scrape
 * @returns The scraped content
 */
export async function scrapeUrl(url: string): Promise<ScrapingResult> {
  let browser: Browser | null = null

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
    })

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    })

    const page = await context.newPage()

    // Navigate to the URL
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    })

    // Extract page content
    const pageTitle = await page.title()

    // Get main content
    // This is a simplistic approach; real implementations should be more sophisticated
    const content = await page.evaluate(() => {
      // Remove script and style elements
      document.querySelectorAll("script, style, nav, footer, header, aside").forEach((el) => el.remove())

      // Get main content - prioritize main element, article, or body
      const mainElement = document.querySelector("main") || document.querySelector("article") || document.body

      return mainElement ? mainElement.innerText : document.body.innerText
    })

    return {
      title: pageTitle,
      content: content.substring(0, 10000), // Limit content length
      url: url,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error during scraping:", error)
    throw new Error(`Failed to scrape URL: ${url}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * Searches for content based on a keyword
 * @param keyword The keyword to search for
 * @param limit The maximum number of results to return
 * @returns An array of search results
 */
export async function searchKeyword(keyword: string, limit = 10): Promise<ScrapingResult[]> {
  let browser: Browser | null = null

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
    })

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    })

    const page = await context.newPage()

    // Navigate to search engine
    await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(keyword)}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    })

    // Extract search results
    const results = await page.evaluate((resultLimit) => {
      const searchResults: { title: string; url: string; snippet: string }[] = []

      // Get search result elements
      const resultElements = document.querySelectorAll("#b_results .b_algo")

      // Extract data from each result
      resultElements.forEach((element, index) => {
        if (index >= resultLimit) return

        const titleElement = element.querySelector("h2 a")
        const snippetElement = element.querySelector(".b_caption p")

        if (titleElement && snippetElement) {
          searchResults.push({
            title: titleElement.textContent || "",
            url: (titleElement as HTMLAnchorElement).href,
            snippet: snippetElement.textContent || "",
          })
        }
      })

      return searchResults
    }, limit)

    // Convert results to ScrapingResult format
    return results.map((result) => ({
      title: result.title,
      content: result.snippet,
      url: result.url,
      timestamp: new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Error during keyword search:", error)
    throw new Error(`Failed to search for keyword: ${keyword}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

