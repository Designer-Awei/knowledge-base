import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ApiKeyCheck } from "@/components/api-key-check"
import { AiAssistantWrapper } from "@/components/ai-assistant-wrapper"
import { Database, Plus, Settings, Home } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "个人知识库",
  description: "自动爬取相关网站并生成知识卡片",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
              <div className="container flex h-14 items-center px-4 md:px-6">
                <div className="mr-4 hidden md:flex">
                  <Link href="/" className="mr-6 flex items-center space-x-2">
                    <Database className="h-6 w-6" />
                    <span className="hidden font-bold sm:inline-block">个人知识库</span>
                  </Link>
                  <nav className="flex items-center space-x-4 text-sm font-medium">
                    <Link href="/">
                      <Button variant="ghost" className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        首页
                      </Button>
                    </Link>
                    <Link href="/knowledge">
                      <Button variant="ghost" className="flex items-center">
                        <Database className="mr-2 h-4 w-4" />
                        知识库
                      </Button>
                    </Link>
                    <Link href="/knowledge/new">
                      <Button variant="ghost" className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        添加卡片
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button variant="ghost" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        设置
                      </Button>
                    </Link>
                  </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                  <div className="w-full flex-1 md:w-auto md:flex-none"></div>
                  <nav className="flex items-center">
                    <Link href="/settings">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                        <span className="ml-2 md:hidden">设置</span>
                      </Button>
                    </Link>
                  </nav>
                </div>
              </div>
            </header>
            <main className="flex-1">
              <div className="container mx-auto px-4 md:px-6 py-6">
                <ApiKeyCheck />
                {children}
              </div>
            </main>
            <footer className="border-t py-6">
              <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-center text-sm text-muted-foreground md:text-left">
                  &copy; {new Date().getFullYear()} 个人知识库 - 基于Next.js和shadcn UI构建
                </p>
              </div>
            </footer>
          </div>
          <AiAssistantWrapper />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'