"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, CheckCircle, Save, Chrome, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ApiTest } from "@/components/api-test"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// 定义备用模型列表，以防导入失败
const DEFAULT_MODELS = [
  { id: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen2.5-7B-Instruct (默认，32K文本，免费)" },
  { id: "THUDM/chatglm3-6b", name: "ChatGLM3-6B (备选，128K文本，免费)" },
  { id: "Qwen/Qwen1.5-7B-Chat", name: "Qwen1.5-7B-Chat (备选，32K文本，免费)" },
  { id: "Qwen/Qwen1.5-14B-Chat", name: "Qwen1.5-14B-Chat (备选，32K文本，付费)" },
]

export default function Settings() {
  const [apiKey, setApiKey] = useState("")
  const [selectedModel, setSelectedModel] = useState("Qwen2.5-7B-Instruct")
  const [isSaving, setIsSaving] = useState(false)
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [keyStatus, setKeyStatus] = useState<"untested" | "valid" | "invalid">("untested")
  const [models, setModels] = useState(DEFAULT_MODELS)
  // Chrome 路径设置
  const [chromePath, setChromePath] = useState("")
  // API 密钥可见性控制
  const [showApiKey, setShowApiKey] = useState(false)

  // 组件挂载时从环境变量加载保存的设置
  useEffect(() => {
    const savedApiKey = process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY || ""
    const savedModel = process.env.NEXT_PUBLIC_SILICONFLOW_MODEL || "Qwen2.5-7B-Instruct"
    // 从本地存储加载 Chrome 路径
    const savedChromePath = localStorage.getItem("chrome_path") || ""

    if (savedApiKey) setApiKey(savedApiKey)
    if (savedModel) setSelectedModel(savedModel)
    if (savedChromePath) setChromePath(savedChromePath)

    // 尝试动态导入模型列表
    import("@/lib/llm-processor")
      .then((module) => {
        if (Array.isArray(module.SUPPORTED_MODELS)) {
          setModels(module.SUPPORTED_MODELS)
        }
      })
      .catch((error) => {
        console.error("无法导入模型列表:", error)
      })
  }, [])

  // 保存 Chrome 路径到本地存储
  const saveChromePathToStorage = (path: string) => {
    localStorage.setItem("chrome_path", path)
    setChromePath(path)
    toast({
      title: "Chrome 路径已保存",
      description: "Chrome 浏览器路径已成功保存",
      duration: 3000,
    })
  }

  const saveSettings = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          model: selectedModel,
        }),
      });
      toast({
        title: "设置已保存",
        description: "服务需要重启才能生效。",
        duration: 5000,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "保存设置失败",
        description: "请重试或检查控制台错误。",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const testApiKey = async () => {
    setIsTestingKey(true)
    setKeyStatus("untested")

    try {
      // 调用 SiliconFlow API 验证密钥
      const response = await fetch("https://api.siliconflow.cn/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (response.ok) {
        setKeyStatus("valid")
        toast({
          title: "API密钥有效",
          description: "您的API密钥已成功验证",
          duration: 5000,
        })
      } else {
        setKeyStatus("invalid")
        toast({
          title: "API密钥无效",
          description: "请检查您的API密钥并重试",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("测试API密钥时出错:", error)
      setKeyStatus("invalid")
      toast({
        title: "测试失败",
        description: "API密钥测试过程中出错。",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsTestingKey(false)
    }
  }

  const startRemoteDebugging = () => {
    console.log("启动远程调试功能")
    
    // 获取操作系统信息
    const platform = navigator.platform
    console.log("当前操作系统:", platform)
    
    // 准备所有平台的基础命令
    const commands = {
      windows: '& "{chromePath}" --remote-debugging-port=9222',
      mac: 'open -a "{chromePath}" --args --remote-debugging-port=9222',
      linux: '"{chromePath}" --remote-debugging-port=9222'
    }
    
    // 确定当前平台的下载链接
    let downloadLink = 'https://www.google.cn/chrome/'
    
    // 生成每个平台的命令
    const windowsCommand = chromePath 
      ? commands.windows.replace('{chromePath}', chromePath) 
      : '& "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222'
    
    const macCommand = chromePath 
      ? commands.mac.replace('{chromePath}', chromePath) 
      : 'open -a "Google Chrome" --args --remote-debugging-port=9222'
    
    const linuxCommand = chromePath 
      ? commands.linux.replace('{chromePath}', chromePath) 
      : 'google-chrome --remote-debugging-port=9222'
    
    // 确定当前平台的命令和平台名称
    let currentCommand = windowsCommand;
    let platformName = 'Windows';
    
    if (platform.includes('Mac')) {
      currentCommand = macCommand;
      platformName = 'macOS';
    } else if (platform.includes('Linux')) {
      currentCommand = linuxCommand;
      platformName = 'Linux';
    }

    console.log("当前平台命令:", currentCommand)

    // 显示操作指南
    toast({
      title: "启动 Chrome 远程调试",
      description: (
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">请按照以下步骤操作：</p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>确保已安装 Chrome 浏览器
                <Button 
                  variant="link" 
                  className="px-2 h-auto"
                  onClick={() => window.open(downloadLink, '_blank')}
                >
                  下载 Chrome
                </Button>
              </li>
              {!chromePath && (
                <li className="text-orange-600">
                  建议在系统设置中配置 Chrome 浏览器路径，以确保命令能正确找到 Chrome
                </li>
              )}
              <li>打开终端或命令提示符（Windows 按 Win+R，输入 cmd 回车）</li>
              <li>复制并运行以下命令：
                <div className="bg-slate-100 p-2 rounded mt-2 relative group">
                  <div className="text-xs font-medium text-slate-500 mb-1">{platformName}:</div>
                  <code className="text-sm break-all">{currentCommand}</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(currentCommand)
                      toast({
                        title: "已复制命令",
                        description: `${platformName} 命令已复制到剪贴板`,
                        duration: 3000,
                      })
                    }}
                  >
                    复制
                  </Button>
                </div>
              </li>
              <li>等待 Chrome 启动完成</li>
              <li>确认命令行参数：
                <div>
                  <p className="text-sm">在Chrome地址栏输入 <code className="bg-slate-100 px-1 rounded">chrome://version</code> 并检查"命令行"部分是否包含：</p>
                  <code className="text-sm bg-slate-100 px-2 py-1 rounded block my-1">--remote-debugging-port=9222</code>
                  <p className="text-sm">若包含，则代表命令执行成功</p>
                </div>
              </li>
            </ol>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-800">
              提示：如果命令执行失败，请确保 Chrome 已正确安装，并在系统设置中配置 Chrome 路径，或尝试手动打开 Chrome 后在地址栏输入：
              <code className="bg-blue-100 px-1 rounded">chrome://inspect/#devices</code>
            </p>
            {platformName === 'Windows' && (
              <div className="mt-2">
                <p className="text-sm text-blue-800">Windows 用户备选命令：</p>
                <div className="bg-slate-100 p-2 rounded mt-1 relative group">
                  <code className="text-sm break-all">Start-Process -FilePath "{chromePath || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}" -ArgumentList "--remote-debugging-port=9222"</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const cmd = `Start-Process -FilePath "${chromePath || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}" -ArgumentList "--remote-debugging-port=9222"`
                      navigator.clipboard.writeText(cmd)
                      toast({
                        title: "已复制备选命令",
                        description: "Windows PowerShell 备选命令已复制到剪贴板",
                        duration: 3000,
                      })
                    }}
                  >
                    复制
                  </Button>
                </div>
                <p className="text-xs text-blue-700 mt-1">* 如果您使用的是 PowerShell，请尝试此命令</p>
              </div>
            )}
          </div>
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => {
              navigator.clipboard.writeText(currentCommand)
              toast({
                title: "已复制命令",
                description: "已复制命令到剪贴板，请在终端中执行",
                duration: 3000,
              })
            }}
          >
            复制命令到剪贴板
          </Button>
        </div>
      ),
      duration: 20000,
    })

    console.log("已显示操作指南")
  }

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast({
      title: "已复制到剪贴板",
      description: "命令已复制，请在终端中执行。",
      duration: 5000,
    });
  };

  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-6">设置</h1>
      <Toaster />
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="llm">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="llm">LLM设置</TabsTrigger>
            <TabsTrigger value="system">系统设置</TabsTrigger>
            <TabsTrigger value="test">API测试</TabsTrigger>
          </TabsList>

          <TabsContent value="llm">
            <Card className="max-w-full">
              <CardHeader>
                <CardTitle>LLM配置</CardTitle>
                <CardDescription>配置用于处理知识卡片内容的大型语言模型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API密钥</Label>
                  <div className="flex space-x-2 relative">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxx"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value)
                        setKeyStatus("untested")
                      }}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-20 top-0 h-full"
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
                    <Button variant="outline" onClick={testApiKey} disabled={!apiKey || isTestingKey}>
                      {isTestingKey ? "测试中..." : "测试"}
                    </Button>
                  </div>

                  {keyStatus === "valid" && (
                    <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription>API密钥有效</AlertDescription>
                    </Alert>
                  )}

                  {keyStatus === "invalid" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>API密钥无效，请检查后重试</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">LLM模型</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="选择LLM模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">所选模型将用于分析网站内容并生成知识卡片摘要</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={saveSettings} disabled={isSaving}>
                  {isSaving ? "保存中..." : "保存设置"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card className="max-w-full">
              <CardHeader>
                <CardTitle>系统设置</CardTitle>
                <CardDescription>配置系统行为和性能选项</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="chrome-path">Chrome 浏览器路径</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="chrome-path"
                      type="text"
                      placeholder="例如: C:\Program Files\Google\Chrome\Application\chrome.exe"
                      value={chromePath}
                      onChange={(e) => setChromePath(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => saveChromePathToStorage(chromePath)}
                      disabled={!chromePath}
                    >
                      保存
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chrome 浏览器的完整路径，用于远程调试功能（例如: <br />
                    Windows: C:\Program Files\Google\Chrome\Application\chrome.exe<br />
                    macOS: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome<br />
                    Linux: /usr/bin/google-chrome）
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">启用通知</Label>
                    <p className="text-sm text-muted-foreground">当知识卡片更新时接收通知</p>
                  </div>
                  <Switch id="notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">深色模式</Label>
                    <p className="text-sm text-muted-foreground">使用深色主题</p>
                  </div>
                  <Switch id="dark-mode" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-cards">最大卡片数量</Label>
                  <Input id="max-cards" type="number" defaultValue="100" min="10" max="1000" />
                  <p className="text-xs text-muted-foreground mt-1">
                    系统将存储的最大知识卡片数量（影响性能和存储空间）
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concurrent-scraping">并发爬取数量</Label>
                  <Input id="concurrent-scraping" type="number" defaultValue="3" min="1" max="10" />
                  <p className="text-xs text-muted-foreground mt-1">
                    同时进行的网站爬取任务数量（较高的值可能导致被网站限制）
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={saveSettings} disabled={isSaving}>
                  {isSaving ? "保存中..." : "保存设置"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <ApiTest />
          </TabsContent>
        </Tabs>

        <div className="space-y-8 max-w-full mt-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Chrome 远程调试</h2>
            <p className="text-sm text-muted-foreground">
              爬虫功能需要 Chrome 浏览器在远程调试模式下运行。点击下方按钮快速启动远程调试模式。
              {!chromePath && <span className="text-orange-600"> (建议先在系统设置中配置 Chrome 路径)</span>}
            </p>
            <Button onClick={startRemoteDebugging} variant="outline">
              <Chrome className="mr-2 h-4 w-4" />
              一键启动远程调试
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

