import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey } = await req.json()
    const key = apiKey || process.env.GEMINI_API_KEY || ''
    if (!key) return NextResponse.json({ error: 'No API key' }, { status: 400 })

    const genAI = new GoogleGenerativeAI(key)
    // Use gemini-2.0-flash-exp which supports image generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        // @ts-ignore — image generation config
        responseModalities: ['IMAGE', 'TEXT'],
      }
    })

    const response = result.response
    const parts = response.candidates?.[0]?.content?.parts || []

    for (const part of parts) {
      // @ts-ignore
      if (part.inlineData) {
        // @ts-ignore
        const { mimeType, data } = part.inlineData
        return NextResponse.json({
          success: true,
          image: `data:${mimeType};base64,${data}`
        })
      }
    }

    return NextResponse.json({ error: 'No image generated' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
