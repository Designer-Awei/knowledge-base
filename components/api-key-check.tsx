"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ApiKeyCheck() {
  const [hasApiKey, setHasApiKey] = useState(true)
  
  useEffect(() => {
    // 检查 API 密钥是否存在于 localStorage 或环境变量中
    const apiKey = localStorage.getItem("llm-api-key") || process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY
    setHasApiKey(!!apiKey && apiKey.length > 0)
  }, [])
  
  if (hasApiKey) {
    return null
  }
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>未配置API密钥</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>您尚未设置LLM API密钥，部分功能可能无法正常工作</span>
        <Link href="/settings">
          <Button variant="outline" size="sm">
            前往设置
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}

