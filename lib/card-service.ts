"use client"

import { v4 as uuidv4 } from "uuid"
import { CrawlerService } from "./crawler-service"
import { LLMProcessor, type KnowledgeCard } from "./llm-processor"
import { saveCard, updateCard as updateStorageCard, getCard } from "./storage-service"

/**
 * 知识卡片服务类
 */
export class CardService {
  private crawlerService: CrawlerService
  private llmProcessor: LLMProcessor

  constructor() {
    this.crawlerService = new CrawlerService()
    this.llmProcessor = new LLMProcessor()
  }

  /**
   * 从网站创建知识卡片
   */
  async createFromWebsite(url: string, tags: string[], frequency: "daily" | "weekly" | "monthly"): Promise<KnowledgeCard> {
    // 直接爬取网站内容
    const websiteContent = await this.crawlerService.scrapeWebsite(url)

    // 生成卡片内容
    const cardContent = await this.llmProcessor.generateCardContent(url, [websiteContent])

    // 创建新卡片
    const card: KnowledgeCard = {
      id: uuidv4(),
      title: cardContent.title || websiteContent.title || url,
      summary: cardContent.summary || "",
      items: cardContent.items || [],
      source: url,
      type: "website",
      tags: cardContent.tags || tags,
      updateFrequency: frequency,
      lastUpdated: Date.now()
    }

    // 保存卡片
    saveCard(card)
    return card
  }

  /**
   * 从关键词创建知识卡片
   */
  async createFromKeyword(keyword: string, tags: string[], frequency: "daily" | "weekly" | "monthly"): Promise<KnowledgeCard> {
    // 搜索相关内容
    const searchResults = await this.crawlerService.search(keyword)

    // 生成卡片内容
    const cardContent = await this.llmProcessor.generateCardContent(keyword, searchResults)

    // 创建新卡片
    const card: KnowledgeCard = {
      id: uuidv4(),
      title: cardContent.title || keyword,
      summary: cardContent.summary || "",
      items: cardContent.items || [],
      source: `keyword:${keyword}`,
      type: "keyword",
      tags: cardContent.tags || tags,
      updateFrequency: frequency,
      lastUpdated: Date.now()
    }

    // 保存卡片
    saveCard(card)
    return card
  }

  /**
   * 更新知识卡片
   */
  async updateCard(cardId: string): Promise<KnowledgeCard> {
    // 获取卡片数据
    const card = getCard(cardId)
    if (!card) {
      throw new Error("卡片不存在")
    }

    let searchResults
    if (card.type === "website") {
      // 对于网站类型，直接爬取网站内容
      searchResults = [await this.crawlerService.scrapeWebsite(card.source)]
    } else {
      // 对于关键词类型，搜索新内容
      const keyword = card.source.replace("keyword:", "")
      searchResults = await this.crawlerService.search(keyword)
    }

    // 更新卡片内容
    const updatedContent = await this.llmProcessor.updateCardContent(card, searchResults)

    // 返回更新后的卡片
    const updatedCard: KnowledgeCard = {
      ...card,
      summary: updatedContent.summary || card.summary,
      items: updatedContent.items || card.items,
      tags: updatedContent.tags || card.tags,
      lastUpdated: Date.now()
    }

    // 保存更新后的卡片
    updateStorageCard(updatedCard)
    return updatedCard
  }
} 