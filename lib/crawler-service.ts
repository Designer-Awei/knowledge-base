"use client"

export interface SearchResult {
  title: string
  content: string
  url: string
}

export interface WebsiteContent {
  title: string
  content: string
  url: string
}

/**
 * 爬虫服务类
 */
export class CrawlerService {
  /**
   * 搜索并爬取内容
   */
  async search(keyword: string): Promise<SearchResult[]> {
    const response = await fetch("/api/crawler", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keyword, type: "search" }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "爬取内容失败")
    }

    return await response.json()
  }

  /**
   * 直接爬取网站内容
   */
  async scrapeWebsite(url: string): Promise<WebsiteContent> {
    const response = await fetch("/api/crawler", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keyword: url, type: "website" }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "爬取网站内容失败")
    }

    return await response.json()
  }
} 