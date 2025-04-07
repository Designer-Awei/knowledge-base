"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ApiTest() {
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("Qwen/Qwen2.5-7B-Instruct")
  const [prompt, setPrompt] = useState("你好，请介绍一下自己。")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // 从环境变量中获取API密钥和模型名称
    const envApiKey = process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY
    const envModel = process.env.NEXT_PUBLIC_SILICONFLOW_API_MODEL
    
    if (envApiKey && envApiKey !== 'your-api-key-here') {
      setApiKey(envApiKey)
    }
    
    if (envModel) {
      setModel(envModel)
    }
  }, [])

  const testApi = async () => {
    setIsLoading(true)
    setResponse("")

    try {
      const res = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant."
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          top_k: 50,
          top_p: 0.7,
          frequency_penalty: 0,
          max_tokens: 2048,
          stream: false,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => "未知错误")
        throw new Error(`API请求失败: ${res.statusText} (${res.status})\n${errorText}`)
      }

      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))

      toast({
        title: "API测试成功",
        description: "成功连接到SiliconFlow API",
      })
    } catch (error) {
      console.error("API测试失败:", error)
      setResponse(error instanceof Error ? error.message : String(error))

      toast({
        title: "API测试失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-full">
      <CardHeader>
        <CardTitle>API测试工具</CardTitle>
        <CardDescription>测试SiliconFlow API连接</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-api-key">API密钥</Label>
          <div className="relative">
            <Input
              id="test-api-key"
              type={showApiKey ? "text" : "password"}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-0 h-full"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showApiKey ? "隐藏密钥" : "显示密钥"}
              </span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-model">模型</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="test-model">
              <SelectValue placeholder="选择模型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Qwen/Qwen2.5-7B-Instruct">Qwen/Qwen2.5-7B-Instruct (默认，32K文本，免费)</SelectItem>
              <SelectItem value="THUDM/glm-4-9b-chat">THUDM/glm-4-9b-chat (备选，128K文本，免费)</SelectItem>
              <SelectItem value="Qwen/Qwen2.5-14B-Instruct">Qwen/Qwen2.5-14B-Instruct (备选，32K文本，付费)</SelectItem>
              <SelectItem value="deepseek-ai/DeepSeek-V3">deepseek-ai/DeepSeek-V3 (备选，64k文本，付费)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-prompt">提示词</Label>
          <Input 
            id="test-prompt" 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入你想问的问题" 
          />
        </div>

        {response && (
          <div className="space-y-2">
            <Label>响应</Label>
            <pre className="p-4 bg-muted rounded-md overflow-auto text-xs max-h-[400px]">{response}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testApi} disabled={isLoading || !apiKey || !model || !prompt} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              测试中...
            </>
          ) : (
            "测试API"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

