"use client"

import dynamic from "next/dynamic"

// 动态导入AI助手组件，禁用SSR
const AiAssistantWithNoSSR = dynamic(() => import("./ai-assistant").then((mod) => ({ default: mod.AiAssistant })), {
  ssr: false,
})

export function AiAssistantWrapper() {
  return <AiAssistantWithNoSSR />
}

