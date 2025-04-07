import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const { apiKey, model } = await request.json()
    
    // 读取现有的 .env.local 文件内容
    const envPath = path.join(process.cwd(), '.env.local')
    let envContent = ''
    try {
      envContent = await fs.readFile(envPath, 'utf-8')
    } catch (error) {
      // 如果文件不存在,创建一个空文件
      envContent = ''
    }

    // 将内容按行分割并转换为对象
    const envLines = envContent.split('\n').filter(line => line.trim())
    const envVars: { [key: string]: string } = {}
    
    envLines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        if (key) {
          envVars[key.trim()] = valueParts.join('=').trim()
        }
      }
    })

    // 更新环境变量
    envVars['NEXT_PUBLIC_SILICONFLOW_API_KEY'] = apiKey
    envVars['NEXT_PUBLIC_SILICONFLOW_MODEL'] = model

    // 将对象转换回环境变量格式
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // 写入文件
    await fs.writeFile(envPath, newEnvContent)

    return NextResponse.json({ 
      success: true,
      message: '设置已保存到 .env.local 文件。请重启开发服务器以使更改生效。'
    })
  } catch (error) {
    console.error('保存设置时出错:', error)
    return NextResponse.json(
      { error: '保存设置失败' },
      { status: 500 }
    )
  }
} 