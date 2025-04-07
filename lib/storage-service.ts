"use client"

import type { KnowledgeCard } from "./llm-processor"

// 本地存储键
const STORAGE_KEY = "knowledge-cards"

/**
 * 从本地存储获取所有知识卡片
 */
export function getAllCards(): KnowledgeCard[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const storedCards = localStorage.getItem(STORAGE_KEY)
    return storedCards ? JSON.parse(storedCards) : []
  } catch (error) {
    console.error("Error retrieving cards from storage:", error)
    return []
  }
}

/**
 * 保存知识卡片到本地存储
 */
export function saveCard(card: KnowledgeCard): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const existingCards = getAllCards()
    const updatedCards = [card, ...existingCards]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards))
  } catch (error) {
    console.error("Error saving card to storage:", error)
  }
}

/**
 * 删除知识卡片
 */
export function deleteCard(cardId: string): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const existingCards = getAllCards()
    const updatedCards = existingCards.filter((card) => card.id !== cardId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards))
  } catch (error) {
    console.error("Error deleting card from storage:", error)
  }
}

/**
 * 更新知识卡片
 */
export function updateCard(updatedCard: KnowledgeCard): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const existingCards = getAllCards()
    const updatedCards = existingCards.map((card) => (card.id === updatedCard.id ? updatedCard : card))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards))
  } catch (error) {
    console.error("Error updating card in storage:", error)
  }
}

/**
 * 获取单个知识卡片
 */
export function getCard(cardId: string): KnowledgeCard | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const existingCards = getAllCards()
    return existingCards.find((card) => card.id === cardId) || null
  } catch (error) {
    console.error("Error getting card from storage:", error)
    return null
  }
}

