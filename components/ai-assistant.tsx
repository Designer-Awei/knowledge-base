"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Bot, Send, X, User, Loader2, MessageSquare, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "您好！我是您的AI助手。有什么我可以帮您的吗？" },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // 清除聊天记录
  const clearChat = () => {
    setMessages([
      { role: "assistant", content: "您好！我是您的AI助手。有什么我可以帮您的吗？" },
    ])
    toast({
      title: "聊天已清除",
      description: "开始新的对话吧！",
    })
  }

  // 确保组件只在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // 获取API密钥和模型
    const apiKey = process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY || localStorage.getItem("llm-api-key")
    const rawModel = process.env.NEXT_PUBLIC_SILICONFLOW_MODEL || localStorage.getItem("llm-model") || "Qwen2.5-7B-Instruct"
    // 确保模型名称格式正确
    const model = rawModel.includes("/") ? rawModel : `Qwen/${rawModel}`

    if (!apiKey) {
      toast({
        title: "未配置API密钥",
        description: "请在.env.local文件中配置NEXT_PUBLIC_SILICONFLOW_API_KEY",
        variant: "destructive",
      })
      return
    }

    // 添加用户消息
    const userMessage = { role: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // 准备对话历史
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // 添加用户的新消息
      chatHistory.push({
        role: "user",
        content: input,
      })

      const requestBody = {
        model: model,
        messages: [
          {
            role: "system",
            content: "你是一个有帮助的中文AI助手。"
          },
          ...chatHistory
        ],
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.5,
        max_tokens: 4096,
        stream: false,
      }

      console.log("发送请求到 SiliconFlow API:", requestBody)

      // 调用SiliconFlow API
      const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API响应错误:", response.status, response.statusText, errorText)
        throw new Error(`API请求失败: ${response.statusText} (${response.status})`)
      }

      const data = await response.json()
      console.log("API响应:", data)

      // 从响应中提取助手消息
      const assistantMessage = data.choices?.[0]?.message?.content || "抱歉，我无法生成回复。"

      // 添加助手回复
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }])
    } catch (error) {
      console.error("聊天请求失败:", error)
      toast({
        title: "请求失败",
        description: `无法获取AI助手的回复: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive",
      })

      // 添加错误消息
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "抱歉，发生了错误。请检查您的API密钥和网络连接。",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 如果组件尚未挂载，则不渲染任何内容
  if (!mounted) return null

  return (
    <>
      {/* 悬浮按钮 */}
      <Button
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-[100] p-0 hover:scale-105 transition-transform"
        onClick={() => setIsOpen(true)}
        size="lg"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* 聊天窗口 */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 sm:w-96 shadow-lg z-[100] flex flex-col h-[70vh]">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <Bot className="mr-2 h-5 w-5" />
                AI助手
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearChat}
                  className="hover:bg-destructive/10"
                  title="清除聊天"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  title="关闭窗口"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 w-full">
            <div className="px-6 py-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] ${
                        message.role === "assistant"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === "assistant" && <Bot className="h-4 w-4 mt-1 shrink-0" />}
                        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                        {message.role === "user" && <User className="h-4 w-4 mt-1 shrink-0" />}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">思考中...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <ScrollBar />
          </ScrollArea>

          <CardFooter className="pt-2 shrink-0">
            <div className="flex w-full items-center space-x-2">
              <Input
                placeholder="输入消息..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage} 
                disabled={isLoading || !input.trim()}
                className="shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  )
}

