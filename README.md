# 个人知识库

一个基于 Next.js 和 shadcn UI 构建的个人知识库网站，能够自动爬取相关网站，生成知识卡片，并根据设置定期更新内容。

## 功能特点

- 自动爬取网站内容，使用 Playwright 在 Chrome/Chromium 上进行爬取
- 使用 SiliconFlow 的 LLM API 分析内容并生成知识卡片
- 支持两种创建知识卡片的方式：
  - 通过关键词搜索自动生成
  - 通过输入特定网站 URL 生成
- 知识卡片功能：
  - Markdown 格式渲染支持
  - 自定义标签管理
  - 灵活的更新频率设置（每天/每周/每月）
  - 支持手动刷新内容
- 搜索和筛选功能：
  - 支持按标题、摘要和标签搜索
  - 支持按类型筛选（全部/网站/关键词）
  - 支持卡片视图和列表视图切换
- 本地存储 API 密钥和用户设置
- 响应式设计，适配各种设备

## 快速入门

### 本地开发环境搭建

#### 1. 环境准备

- Node.js 18.x 或更高版本
- pnpm 包管理器（推荐）或 npm、yarn
- Chrome/Chromium 浏览器（用于网页爬取）
- SiliconFlow API 密钥（从 [SiliconFlow 官网](https://docs.siliconflow.cn/) 获取）

#### 2. 克隆并安装项目

```bash
# 克隆仓库
git clone <repository-url>
cd knowledge-base

# 安装依赖
pnpm install
# 或者使用 npm
# npm install
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板文件
cp .env.example .env.local

# 编辑 .env.local 文件，填入 SiliconFlow API 密钥和默认模型
# NEXT_PUBLIC_SILICONFLOW_API_KEY=your_api_key_here
# NEXT_PUBLIC_SILICONFLOW_MODEL=Qwen/Qwen2.5-7B-Instruct
```

> **注意**：`NEXT_PUBLIC_SILICONFLOW_MODEL` 环境变量用于保存您在界面上选择的模型，当您通过 UI 更改模型选择时，此设置会自动更新，并在服务重启后生效。

#### 4. 启动开发服务器

```bash
pnpm dev
# 或者使用 npm
# npm run dev
```

访问 http://localhost:3000 即可开始使用。

### 生产环境部署

#### Vercel 部署

1. Fork 本项目到你的 GitHub 账号
2. 在 Vercel 中导入该项目
3. 配置环境变量：
   - `NEXT_PUBLIC_SILICONFLOW_API_KEY`：你的 SiliconFlow API 密钥
   - `NEXT_PUBLIC_SILICONFLOW_MODEL`：默认使用的模型，如 `Qwen/Qwen2.5-7B-Instruct`
4. 完成部署

## 详细使用教程

### 第一次使用配置

1. **导航到设置页面**：点击顶部导航栏的"设置"图标或直接访问 `/settings` 路径。

2. **LLM 设置配置**：
   - 进入"LLM设置"标签页
   - 配置 SiliconFlow API 密钥：
     - 在 API 密钥输入框中填入你的密钥
     - 可以点击输入框右侧的眼睛图标切换密钥的可见性
     - 点击"测试"按钮验证 API 密钥是否有效
   - 选择合适的 LLM 模型：
     - Qwen/Qwen2.5-7B-Instruct（默认，32K文本，免费）
     - THUDM/chatglm3-6b（备选，128K文本，免费）
     - Qwen/Qwen1.5-7B-Chat（备选，32K文本，免费）
     - Qwen/Qwen1.5-14B-Chat（备选，32K文本，付费）
   - 点击"保存设置"按钮保存你的配置
   - **注意**：选择的模型会自动保存到`.env.local`文件中的`NEXT_PUBLIC_SILICONFLOW_MODEL`变量，需要重启服务器才能生效

3. **系统设置配置**：
   - 进入"系统设置"标签页
   - 配置 Chrome 浏览器路径：
     - 输入你本地 Chrome 浏览器的完整路径，例如：
       - Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`
       - macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
       - Linux: `/usr/bin/google-chrome`
     - 点击"保存"按钮保存路径
   - 设置其他系统选项：
     - 启用通知
     - 深色模式
     - 最大卡片数量
     - 并发爬取数量

4. **API 测试**：
   - 进入"API测试"标签页
   - 在 API 密钥输入框中输入你的密钥（可点击眼睛图标切换可见性）
   - 选择模型
   - 输入提示词
   - 点击"测试API"按钮测试 API 连接

### 启动 Chrome 远程调试

系统使用爬虫功能需要 Chrome 浏览器在远程调试模式下运行。有两种方式启动：

#### 方式一：使用"一键启动远程调试"功能

1. 在设置页面底部找到"Chrome 远程调试"部分
2. 点击"一键启动远程调试"按钮
3. 系统会显示一个通知，包含适用于你当前操作系统的命令
4. 复制命令，并在终端或命令提示符中运行
5. 等待 Chrome 浏览器启动

#### 方式二：手动启动

根据你的操作系统，在终端中运行以下命令：

```bash
# Windows
start "C:\Path\To\Your\chrome.exe" --remote-debugging-port=9222
# 或者默认安装路径
start chrome --remote-debugging-port=9222

# macOS
open -a "/Applications/Google Chrome.app" --args --remote-debugging-port=9222
# 或者默认安装路径
open -a "Google Chrome" --args --remote-debugging-port=9222

# Linux
"/usr/bin/google-chrome" --remote-debugging-port=9222
# 或者默认安装路径
google-chrome --remote-debugging-port=9222
```

如果命令执行失败，请确保 Chrome 已正确安装，并尝试手动打开 Chrome 后在地址栏输入：`chrome://inspect/#devices`

### 创建知识卡片

#### 通过关键词搜索创建

1. 点击顶部导航栏的"添加卡片"或首页上的"添加新卡片"按钮
2. 选择"关键词搜索"选项
3. 填写表单：
   - 输入关键词
   - 设置标签（用逗号分隔多个标签）
   - 选择更新频率（每天/每周/每月）
   - 设置爬取网站数量（1-50）
4. 点击"创建"按钮开始爬取和生成知识卡片
   - 注意：此步骤需要 Chrome 远程调试模式已启动

#### 通过网站 URL 创建

1. 点击顶部导航栏的"添加卡片"或首页上的"添加新卡片"按钮
2. 选择"网站 URL"选项
3. 填写表单：
   - 输入网站地址（必须包含 http:// 或 https://）
   - 设置标签（用逗号分隔多个标签）
   - 选择更新频率（每天/每周/每月）
4. 点击"创建"按钮开始爬取和生成知识卡片
   - 注意：此步骤需要 Chrome 远程调试模式已启动

### 管理知识卡片

1. **浏览知识卡片**：
   - 在首页或知识库页面查看所有知识卡片
   - 使用右上角的布局切换按钮在卡片视图和列表视图之间切换

2. **搜索和筛选**：
   - 使用顶部搜索框搜索特定内容
   - 使用筛选选项按标签或类型（全部/网站/关键词）筛选卡片

3. **查看卡片详情**：
   - 点击卡片查看详细内容
   - 内容支持 Markdown 格式渲染

4. **更新卡片**：
   - 在卡片详情页面点击"更新"按钮手动更新内容
   - 系统也会根据设置的更新频率自动更新内容

5. **删除卡片**：
   - 在卡片详情页面点击"删除"按钮移除不需要的卡片

## 注意事项

- 确保 Chrome 浏览器在远程调试模式下运行（端口 9222）
- API 密钥请妥善保管，建议使用环境变量存储
- 爬取内容时请遵守目标网站的使用条款和爬虫协议
- 建议合理设置知识卡片的更新频率，避免过于频繁的 API 调用
- 使用付费模型时请注意计费规则：总费用 = (输入tokens × 输入单价) + (输出tokens × 输出单价)
- 在 Vercel 部署时，爬虫功能需要配合本地 Chrome 远程调试使用
- 建议在本地开发环境中进行批量爬取或更新操作

## 故障排除

### Chrome 远程调试问题

- **找不到 Chrome**：确保在系统设置中正确配置了 Chrome 路径
- **Chrome 启动失败**：检查 Chrome 是否已经在远程调试模式下运行（每次只能有一个实例使用同一端口）
- **连接超时**：确保你的网络连接正常，并且没有防火墙阻止连接

### API 连接问题

- **API 密钥无效**：确保你的 SiliconFlow API 密钥正确并且有效
- **API 请求失败**：检查网络连接，可以使用"API测试"功能进行测试

### 爬虫功能问题

- **爬取失败**：确保目标网站允许爬取，某些网站可能有反爬虫机制
- **内容生成失败**：检查 API 密钥是否有效，以及选择的模型是否可用

## 技术栈

- [Next.js](https://nextjs.org/) - React 框架
- [shadcn UI](https://ui.shadcn.com/) - UI 组件库
- [Playwright](https://playwright.dev/) - 网页爬取
- [SiliconFlow API](https://docs.siliconflow.cn/) - LLM 服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown 渲染
- [UUID](https://github.com/uuidjs/uuid) - 生成唯一标识符

## 许可证

MIT

