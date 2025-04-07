"use client"

import type { SearchResult } from "./crawler-service"

export const SUPPORTED_MODELS = [
  { id: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen/Qwen2.5-7B-Instruct (默认，32K文本，免费)" },
  { id: "THUDM/glm-4-9b-chat", name: "THUDM/glm-4-9b-chat (备选，128K文本，免费)" },
  { id: "Qwen/Qwen2.5-14B-Instruct", name: "Qwen/Qwen2.5-14B-Instruct (备选，32K文本，付费)" },
  { id: "deepseek-ai/DeepSeek-V3", name: "deepseek-ai/DeepSeek-V3 (备选，64k文本，付费)" },
]

export interface KnowledgeItem {
  title: string
  content: string
}

export interface KnowledgeCard {
  id: string
  title: string
  summary: string // 摘要
  items: KnowledgeItem[] // 知识条目
  source: string
  type: "website" | "keyword"
  updateFrequency: "daily" | "weekly" | "monthly"
  lastUpdated: number
  tags: string[]
}

/**
 * LLM处理服务类
 */
export class LLMProcessor {
  /**
   * 从搜索结果生成知识卡片内容
   */
  async generateCardContent(keyword: string, searchResults: SearchResult[]): Promise<Partial<KnowledgeCard>> {
    const response = await fetch("/api/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "generate",
        keyword,
        searchResults,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "生成内容失败")
    }

    return await response.json()
  }

  /**
   * 更新知识卡片内容
   */
  async updateCardContent(card: KnowledgeCard, searchResults: SearchResult[]): Promise<Partial<KnowledgeCard>> {
    const response = await fetch("/api/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update",
        card,
        searchResults,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "更新内容失败")
    }

    return await response.json()
  }
}

