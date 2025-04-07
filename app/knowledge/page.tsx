"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, RefreshCw, Trash2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllCards, deleteCard, updateCard } from "@/lib/storage-service"
import type { KnowledgeCard } from "@/lib/llm-processor"
import { useToast } from "@/components/ui/use-toast"

export default function KnowledgeBase() {
  const { toast } = useToast()
  const [cards, setCards] = useState<KnowledgeCard[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null)

  // 从本地存储加载卡片
  useEffect(() => {
    const storedCards = getAllCards()
    setCards(storedCards)
  }, [])

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    if (filterType === "all") return matchesSearch
    return matchesSearch && card.type === filterType
  })

  const handleRefresh = async (id: string) => {
    setIsRefreshing(id)

    try {
      // 在实际应用中，这里应该重新爬取和处理内容
      // 现在我们只是模拟更新
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const cardToUpdate = cards.find((card) => card.id === id)
      if (cardToUpdate) {
        const updatedCard = {
          ...cardToUpdate,
          lastUpdated: new Date().toISOString(),
        }

        // 更新本地存储和状态
        updateCard(updatedCard)
        setCards(cards.map((card) => (card.id === id ? updatedCard : card)))

        toast({
          title: "卡片已更新",
          description: "知识卡片内容已成功刷新",
        })
      }
    } catch (error) {
      console.error("Error refreshing card:", error)
      toast({
        title: "更新失败",
        description: "无法刷新知识卡片，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个知识卡片吗？")) {
      // 从本地存储和状态中删除卡片
      deleteCard(id)
      setCards(cards.filter((card) => card.id !== id))

      toast({
        title: "卡片已删除",
        description: "知识卡片已成功删除",
      })
    }
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">知识库</h1>
        <Link href="/knowledge/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> 添加知识卡片
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索知识卡片..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="筛选类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有类型</SelectItem>
            <SelectItem value="website">网站</SelectItem>
            <SelectItem value="keyword">关键词</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="grid" className="mb-8">
        <TabsList>
          <TabsTrigger value="grid">卡片视图</TabsTrigger>
          <TabsTrigger value="list">列表视图</TabsTrigger>
        </TabsList>
        <TabsContent value="grid">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">暂无知识卡片</p>
              <Link href="/knowledge/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> 创建第一个知识卡片
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card) => (
                <Link href={`/knowledge/${card.id}`} key={card.id}>
                  <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>{card.title}</CardTitle>
                      <CardDescription>
                        来源: {card.type === "website" ? card.source : `关键词: ${card.source.replace("keyword:", "")}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{card.content}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {card.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          更新频率:{" "}
                          {card.updateFrequency === "daily"
                            ? "每天"
                            : card.updateFrequency === "weekly"
                              ? "每周"
                              : "每月"}
                        </span>
                        <span>最后更新: {new Date(card.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          handleRefresh(card.id)
                        }}
                        disabled={isRefreshing === card.id}
                      >
                        {isRefreshing === card.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            刷新中...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" /> 刷新
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          handleDelete(card.id)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> 删除
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="list">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">暂无知识卡片</p>
              <Link href="/knowledge/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> 创建第一个知识卡片
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCards.map((card) => (
                <Card key={card.id}>
                  <div className="flex flex-col sm:flex-row gap-4 p-4">
                    <div className="flex-1">
                      <h3 className="font-bold">{card.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{card.summary}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {card.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col justify-between sm:items-end">
                      <div className="text-xs text-muted-foreground mb-2">
                        <div>
                          更新频率:{" "}
                          {card.updateFrequency === "daily"
                            ? "每天"
                            : card.updateFrequency === "weekly"
                              ? "每周"
                              : "每月"}
                        </div>
                        <div>最后更新: {new Date(card.lastUpdated).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleRefresh(card.id)
                          }}
                          disabled={isRefreshing === card.id}
                        >
                          {isRefreshing === card.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              刷新中...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" /> 刷新
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleDelete(card.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> 删除
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

