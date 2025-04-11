"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getCard, deleteCard } from "@/lib/storage-service"
import { CardService } from "@/lib/card-service"
import type { KnowledgeCard } from "@/lib/llm-processor"
import ReactMarkdown from 'react-markdown'

// 从本地存储获取API密钥
const getApiKey = () => {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("llm-api-key") || ""
}

export default function KnowledgeCardDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [card, setCard] = useState<KnowledgeCard | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const cardData = getCard(resolvedParams.id)
    setCard(cardData)
  }, [resolvedParams.id])

  const handleRefresh = async () => {
    if (!card) return

    const apiKey = getApiKey()
    if (!apiKey) {
      toast({
        title: "错误",
        description: "请先在设置页面配置API密钥",
        variant: "destructive",
      })
      return
    }

    setIsRefreshing(true)
    try {
      const cardService = new CardService()
      const updatedCard = await cardService.updateCard(card.id)
      setCard(updatedCard)
      toast({
        title: "刷新成功",
        description: "知识卡片内容已更新",
      })
    } catch (error) {
      console.error("Error refreshing card:", error)
      toast({
        title: "刷新失败",
        description: error instanceof Error ? error.message : "更新知识卡片时出现错误",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDelete = async () => {
    if (!card) return
    try {
      await deleteCard(card.id)
      toast({
        title: "删除成功",
        description: "知识卡片已删除",
      })
      router.push("/knowledge")
    } catch (error) {
      toast({
        title: "删除失败",
        description: "删除知识卡片时出现错误",
        variant: "destructive",
      })
    }
  }

  if (!card) {
    return (
      <div className="container">
        <div className="text-center">知识卡片不存在</div>
      </div>
    )
  }

  return (
    <div className="container">
      <Link href="/knowledge" className="flex items-center text-primary mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回知识库
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{card.title}</CardTitle>
          <CardDescription>
            来源: {card.type === "website" ? card.source : `关键词: ${card.source.replace("keyword:", "")}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mb-2">摘要</h3>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  a: () => {
                    // 摘要中不显示任何链接
                    return null;
                  }
                }}
              >
                {card.summary}
              </ReactMarkdown>
            </div>
          </div>

          <div className="prose max-w-none space-y-4">
            <h3 className="text-lg font-semibold mb-2">知识条目</h3>
            {card.items?.map((item, index) => (
              <div key={index} className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      a: ({ node, ref, href, children, ...props }) => {
                        // 移除原文链接的markdown格式
                        const text = children.toString();
                        const isOriginalLink = text.includes("[点击查看原文]") || text.includes("[点击查看全文]");
                        
                        if (isOriginalLink) {
                          // 提取实际的URL
                          const urlMatch = text.match(/\((.*?)\)/);
                          const url = urlMatch ? urlMatch[1] : href;
                          
                          return (
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              点击查看原文
                            </a>
                          );
                        }
                        
                        return (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 underline hover:text-blue-800"
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {item.content}
                  </ReactMarkdown>
                </div>
              </div>
            )) || <p className="text-muted-foreground">暂无知识条目</p>}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {card.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
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
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                刷新中...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> 刷新内容
              </>
            )}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> 删除卡片
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 