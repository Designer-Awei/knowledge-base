import { NextResponse } from "next/server"
import OpenAI from "openai"
import type { SearchResult } from "@/lib/crawler-service"
import type { KnowledgeCard } from "@/lib/llm-processor"

// 从环境变量或设置获取API密钥
const getApiConfig = async () => {
  const apiKey = process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY || ""
  const model = process.env.NEXT_PUBLIC_SILICONFLOW_MODEL || "Qwen/Qwen2.5-7B-Instruct"
  
  console.log("API配置信息:", {
    hasApiKey: !!apiKey,
    model,
    envKeys: Object.keys(process.env).filter(key => key.includes('SILICONFLOW'))
  })
  
  return { apiKey, model }
}

export async function POST(request: Request) {
  try {
    const { action, keyword, searchResults, card } = await request.json()
    console.log("收到LLM请求:", { action, keyword })
    
    const { apiKey, model } = await getApiConfig()
    console.log("API配置:", { hasApiKey: !!apiKey, model })

    if (!apiKey) {
      console.error("API密钥未配置")
      return NextResponse.json({ error: "API密钥未配置" }, { status: 400 })
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.siliconflow.cn/v1"
    })

    // 确保模型名称格式正确
    const modelName = model.includes("/") ? model : `Qwen/${model}`
    console.log("使用模型:", modelName)

    if (action === "generate") {
      try {
        // 解析网站内容
        let websiteInfo = {}
        if (card?.type === "website" && searchResults.content) {
          try {
            websiteInfo = JSON.parse(searchResults.content)
            console.log("解析到的网站信息:", {
              hasDescription: !!websiteInfo.description,
              hasKeywords: !!websiteInfo.keywords,
              articlesCount: websiteInfo.articles?.length,
              hasMainText: !!websiteInfo.mainText
            })
          } catch (error) {
            console.error("解析网站内容失败:", error)
          }
        }

        const prompt = `
我需要你基于以下${card?.type === "website" ? "网站" : "搜索"}内容，生成一个关于"${keyword}"的知识卡片。
${card?.type === "website" ? `这是一个网站类型的知识卡片，我已经爬取了该网站的主要信息：

网站描述：${websiteInfo.description || "无"}
关键词：${websiteInfo.keywords || "无"}
主要导航栏目：${websiteInfo.navigation || "无"}
主要内容：${websiteInfo.mainText?.slice(0, 500) || "无"}

最新文章列表：
${websiteInfo.articles?.map((article, index) => `
${index + 1}. 标题：${article.title}
   链接：${article.url}
   简介：${article.description || "无"}
`).join("\n") || "无最新文章"}

请基于以上信息生成知识卡片，要求：
1. 第一个知识条目必须是对网站的整体介绍，末尾使用Markdown格式添加链接：[点击查看原文](${keyword})
2. 后续条目应该是对最新文章内容的总结，每个条目末尾都必须使用Markdown格式添加链接：[点击查看原文](文章URL)
3. 确保生成4-6个知识条目，内容要详实且相关性强
4. 确保内容的时效性和多样性` : ""}

知识卡片应该包含以下要素：
1. 标题：简洁明了地概括主题
2. 摘要：对主题的简要概述，不超过200字，严格禁止包含任何URL或"点击查看原文"等链接文本
3. 知识条目：生成4-6个知识条目，每个条目必须包含：
   - 标题：简短且能反映内容重点
   - 内容：详实的段落，避免空泛
   - 链接：使用Markdown格式 [点击查看原文](URL) 放在内容末尾
4. 标签：3-5个相关的标签词

${card?.type !== "website" ? `以下是搜索结果：
${searchResults.map((result: SearchResult, index: number) => `
来源 ${index + 1}：${result.url}
标题：${result.title}
内容：${result.content}
`).join("\n")}` : ""}

请以JSON格式返回，格式如下：
{
  "title": "主题标题",
  "summary": "主题摘要（200字以内，不包含URL）",
  "items": [
    {
      "title": "知识条目1标题",
      "content": "知识条目1详细内容。[点击查看原文](https://example.com/article1)"
    },
    {
      "title": "知识条目2标题",
      "content": "知识条目2详细内容。[点击查看原文](https://example.com/article2)"
    }
  ],
  "tags": ["标签1", "标签2", "标签3"]
}

注意：
1. 确保生成的是合法的 JSON 格式
2. items 数组必须包含4-6个知识条目
3. 每个知识条目的内容末尾必须使用Markdown格式添加链接：[点击查看原文](URL)
4. 知识条目的内容应该是完整的段落，不要过于简单
5. 避免重复的内容
6. 确保内容的准确性和时效性
7. 摘要中严格禁止包含任何URL链接或"点击查看原文"等字样
`
        console.log("发送到LLM的请求配置:", {
          model: modelName,
          promptLength: prompt.length,
          temperature: 0.7,
          max_tokens: 4000
        })

        const response = await client.chat.completions.create({
          model: modelName,
          messages: [
            { 
              role: "system", 
              content: `你是一个专业的知识整理助手，善于从多个信息源中提取、总结和组织知识。
你的职责是创建内容丰富、结构清晰的知识卡片。
你必须始终返回合法的 JSON 格式数据，包含以下字段：
- title: 标题
- summary: 摘要（200字以内）
- items: 知识条目数组，每个条目包含 title 和 content
- tags: 标签数组（3-5个标签）

每个知识条目都应该：
1. 包含有价值的信息，避免空泛或重复的内容
2. 内容详实，使用完整的段落
3. 保持客观准确的表述
4. 注意信息的时效性` 
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.6,
          max_tokens: 4000,
          response_format: { type: "json_object" },
          top_p: 0.95,
          frequency_penalty: 0.5
        })

        const result = JSON.parse(response.choices[0].message.content)
        
        // 确保返回的结果包含所有必要字段
        if (!result.items || !Array.isArray(result.items)) {
          result.items = []
        }
        if (!result.summary) {
          result.summary = ""
        }
        if (!result.tags || !Array.isArray(result.tags)) {
          result.tags = []
        }
        
        return NextResponse.json(result)
      } catch (error) {
        console.error("LLM API调用错误:", {
          error: error instanceof Error ? error.message : String(error),
          model: modelName,
          apiKeyLength: apiKey.length
        })
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : "调用LLM API时出错" 
        }, { status: 500 })
      }
    }

    if (action === "update") {
      try {
        if (!searchResults || !Array.isArray(searchResults) && !searchResults.content) {
          console.error("更新卡片时搜索结果无效:", searchResults)
          return NextResponse.json({ error: "搜索结果无效" }, { status: 400 })
        }

        // 解析网站内容
        let websiteInfo = {}
        if (card.type === "website" && searchResults.content) {
          try {
            websiteInfo = JSON.parse(searchResults.content)
            console.log("解析到的网站更新信息:", {
              hasDescription: !!websiteInfo.description,
              hasKeywords: !!websiteInfo.keywords,
              articlesCount: websiteInfo.articles?.length,
              hasMainText: !!websiteInfo.mainText
            })
          } catch (error) {
            console.error("解析网站内容失败:", error)
          }
        }

        const prompt = `
我需要你基于以下新的${card.type === "website" ? "网站" : "搜索"}内容，更新一个关于"${card.title}"的知识卡片。

${card.type === "website" ? `这是一个网站类型的知识卡片，我已经爬取了该网站的最新信息：

网站描述：${websiteInfo.description || "无"}
关键词：${websiteInfo.keywords || "无"}
主要导航栏目：${websiteInfo.navigation || "无"}
主要内容：${websiteInfo.mainText?.slice(0, 500) || "无"}

最新文章列表：
${websiteInfo.articles?.map((article, index) => `
${index + 1}. 标题：${article.title}
   链接：${article.url}
   简介：${article.description || "无"}
`).join("\n") || "无最新文章"}` : ""}

当前知识卡片内容：
标题：${card.title}
摘要：${card.summary || ""}
知识条目：
${card.items?.map((item, index) => `
${index + 1}. ${item.title}
${item.content}
`).join("\n") || "暂无知识条目"}
当前标签：${card.tags?.join(", ") || ""}

${card.type === "website" ? `
请基于最新爬取的内容更新知识卡片，要求：
1. 保留第一个条目作为网站介绍，但根据新信息适当更新，末尾使用Markdown格式添加链接：[点击查看原文](${card.source})
2. 添加最新文章作为新的知识条目，每个条目末尾都必须使用Markdown格式添加链接：[点击查看原文](文章URL)
3. 确保有4-6个知识条目，内容要详实且相关性强
4. 更新摘要以反映最新状态（不要包含URL）
5. 如果需要，更新标签
6. 对于已有的知识条目，如果内容仍然有效，应该保留` : `
新的搜索结果：
${searchResults.map((result: SearchResult, index: number) => `
来源 ${index + 1}：${result.url}
标题：${result.title}
内容：${result.content}
`).join("\n")}

请基于新的搜索结果更新知识卡片，要求：
1. 保留现有的有价值的知识条目
2. 添加新的知识条目，确保总数在4-6个之间
3. 每个条目末尾都必须使用Markdown格式添加链接：[点击查看原文](URL)
4. 更新摘要以包含新的信息（不要包含URL）
5. 如果需要，更新标签`}

请以JSON格式返回，格式如下：
{
  "summary": "更新后的摘要（200字以内，严格禁止包含URL或链接文本）",
  "items": [
    {
      "title": "知识条目1标题",
      "content": "知识条目1详细内容。[点击查看原文](https://example.com/article1)"
    },
    {
      "title": "知识条目2标题",
      "content": "知识条目2详细内容。[点击查看原文](https://example.com/article2)"
    }
  ],
  "tags": ["标签1", "标签2", "标签3"]
}

注意：
1. 确保生成4-6个知识条目
2. 每个知识条目的内容末尾必须使用Markdown格式添加链接：[点击查看原文](URL)
3. 知识条目的内容应该是完整的段落，不要过于简单
4. 避免重复的内容
5. 确保内容的准确性和时效性
6. 摘要中严格禁止包含任何URL链接或"点击查看原文"等字样
`
        console.log("发送到LLM的更新请求配置:", {
          model: modelName,
          promptLength: prompt.length,
          temperature: 0.7,
          max_tokens: 4000
        })

        const response = await client.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: "你是一个专业的知识更新助手，善于发现新信息并整合到现有知识中。你的职责是保持知识卡片的内容最新、准确和完整。" },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: "json_object" },
          top_p: 0.9,
          frequency_penalty: 0.5
        })

        const result = JSON.parse(response.choices[0].message.content)
        
        // 确保返回的结果包含所有必要字段
        if (!result.items || !Array.isArray(result.items)) {
          result.items = card.items || []
        }
        if (!result.summary) {
          result.summary = card.summary || ""
        }
        if (!result.tags || !Array.isArray(result.tags)) {
          result.tags = card.tags || []
        }
        
        return NextResponse.json(result)
      } catch (error) {
        console.error("LLM API更新调用错误:", {
          error: error instanceof Error ? error.message : String(error),
          model: modelName,
          apiKeyLength: apiKey.length,
          cardTitle: card.title
        })
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : "更新知识卡片内容时出错" 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "无效的操作" }, { status: 400 })
  } catch (error) {
    console.error("LLM API错误:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "处理请求时出错，请检查API密钥和模型配置是否正确" 
    }, { status: 500 })
  }
}