"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Search, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { CardService } from "@/lib/card-service"
import type { KnowledgeCard } from "@/lib/llm-processor"

// 从环境变量获取API密钥
const getApiKey = () => {
  return process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY || ""
}

export default function NewKnowledgeCard() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Website form state
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [websiteTags, setWebsiteTags] = useState("")
  const [websiteFrequency, setWebsiteFrequency] = useState("weekly")

  // Keyword form state
  const [keyword, setKeyword] = useState("")
  const [keywordTags, setKeywordTags] = useState("")
  const [keywordFrequency, setKeywordFrequency] = useState("daily")
  const [keywordLimit, setKeywordLimit] = useState("10")

  const handleWebsiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const apiKey = getApiKey()
    if (!apiKey) {
      toast({
        title: "错误",
        description: "请先在设置页面配置API密钥",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const cardService = new CardService()
      const card = await cardService.createFromWebsite(
        websiteUrl,
        websiteTags.split(",").map((tag) => tag.trim()),
        websiteFrequency as "daily" | "weekly" | "monthly"
      )

      toast({
        title: "知识卡片已创建",
        description: `已成功从 ${websiteUrl} 创建知识卡片`,
      })

      router.push("/knowledge")
    } catch (error) {
      console.error("Error creating card:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "无法创建知识卡片，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeywordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("表单提交事件触发")
    setIsLoading(true)

    const apiKey = getApiKey()
    console.log("API密钥状态:", !!apiKey)
    
    if (!apiKey) {
      toast({
        title: "错误",
        description: "请先在设置页面配置API密钥",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      console.log("开始创建知识卡片:", { keyword, tags: keywordTags, frequency: keywordFrequency })
      const cardService = new CardService()
      console.log("CardService实例已创建")
      
      const card = await cardService.createFromKeyword(
        keyword,
        keywordTags.split(",").map((tag) => tag.trim()),
        keywordFrequency as "daily" | "weekly" | "monthly"
      )

      console.log("知识卡片创建成功:", card)
      toast({
        title: "知识卡片已创建",
        description: `已成功为关键词 "${keyword}" 创建知识卡片`,
      })

      router.push("/knowledge")
    } catch (error) {
      console.error("创建知识卡片时出错:", error)
      let errorMessage = "无法创建知识卡片，请稍后再试"
      
      if (error instanceof Error) {
        console.error("错误详情:", error.message, error.stack)
        errorMessage = error.message
      }
      
      // 检查是否是 Chrome 连接错误
      if (errorMessage.includes("connect") || errorMessage.includes("9222")) {
        errorMessage = "无法连接到 Chrome 浏览器，请确保 Chrome 已在远程调试模式下运行。\n运行命令：\nwindows: start chrome.exe --remote-debugging-port=9222"
      }

      toast({
        title: "创建失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <Link href="/knowledge" className="flex items-center text-primary mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回知识库
      </Link>

      <div className="flex justify-center mb-8">
        <h1 className="text-3xl font-bold">创建新知识卡片</h1>
      </div>

      <Tabs defaultValue="website" className="max-w-3xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="website" className="flex items-center justify-center">
            <Globe className="mr-2 h-4 w-4" /> 网站
          </TabsTrigger>
          <TabsTrigger value="keyword" className="flex items-center justify-center">
            <Search className="mr-2 h-4 w-4" /> 关键词
          </TabsTrigger>
        </TabsList>

        <TabsContent value="website">
          <Card>
            <CardHeader>
              <CardTitle>添加网站</CardTitle>
              <CardDescription>输入网站URL，我们将爬取内容并生成知识卡片</CardDescription>
            </CardHeader>
            <form onSubmit={handleWebsiteSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website-url">网站URL</Label>
                  <Input
                    id="website-url"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website-tags">标签（用逗号分隔）</Label>
                  <Input
                    id="website-tags"
                    placeholder="技术, 教程, Next.js"
                    value={websiteTags}
                    onChange={(e) => setWebsiteTags(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website-frequency">更新频率</Label>
                  <Select value={websiteFrequency} onValueChange={setWebsiteFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择更新频率" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">每天</SelectItem>
                      <SelectItem value="weekly">每周</SelectItem>
                      <SelectItem value="monthly">每月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    "创建知识卡片"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="keyword">
          <Card>
            <CardHeader>
              <CardTitle>添加关键词</CardTitle>
              <CardDescription>输入关键词，我们将搜索相关内容并生成知识卡片</CardDescription>
            </CardHeader>
            <form onSubmit={handleKeywordSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyword">关键词</Label>
                  <Input
                    id="keyword"
                    placeholder="人工智能"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyword-tags">标签（用逗号分隔）</Label>
                  <Input
                    id="keyword-tags"
                    placeholder="AI, 技术, 研究"
                    value={keywordTags}
                    onChange={(e) => setKeywordTags(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyword-limit">爬取网站数量</Label>
                  <Input
                    id="keyword-limit"
                    type="number"
                    min="1"
                    max="50"
                    value={keywordLimit}
                    onChange={(e) => setKeywordLimit(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    设置要爬取的网站数量（1-50），数量越多信息越全面，但处理时间也会更长
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyword-frequency">更新频率</Label>
                  <Select value={keywordFrequency} onValueChange={setKeywordFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择更新频率" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">每天</SelectItem>
                      <SelectItem value="weekly">每周</SelectItem>
                      <SelectItem value="monthly">每月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading} onClick={(e) => {
                  e.preventDefault()
                  handleKeywordSubmit(e)
                }}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    "创建知识卡片"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

