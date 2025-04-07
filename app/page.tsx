import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Settings, Database, MessageSquare } from "lucide-react"

export default function Home() {
  return (
    <div className="container">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">个人知识库</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          自动爬取相关网站，生成知识卡片并根据您的设置定期更新内容
        </p>
        <div className="mt-4 flex items-center text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4 mr-1" />
          <span>点击右下角的按钮可以打开AI助手，测试LLM集成</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>知识卡片管理</CardTitle>
            <CardDescription>浏览和管理您的所有知识卡片</CardDescription>
          </CardHeader>
          <CardContent>
            <Database className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p>查看您已创建的所有知识卡片，按类别筛选或搜索</p>
          </CardContent>
          <CardFooter>
            <Link href="/knowledge" className="w-full">
              <Button className="w-full">浏览知识库</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>添加新卡片</CardTitle>
            <CardDescription>创建新的知识卡片</CardDescription>
          </CardHeader>
          <CardContent>
            <PlusCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p>通过关键词搜索或添加特定网站来创建新的知识卡片</p>
          </CardContent>
          <CardFooter>
            <Link href="/knowledge/new" className="w-full">
              <Button className="w-full">创建卡片</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>设置</CardTitle>
            <CardDescription>配置LLM和系统设置</CardDescription>
          </CardHeader>
          <CardContent>
            <Settings className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p>设置您的API密钥，选择LLM模型，以及配置其他系统选项</p>
          </CardContent>
          <CardFooter>
            <Link href="/settings" className="w-full">
              <Button className="w-full">打开设置</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

