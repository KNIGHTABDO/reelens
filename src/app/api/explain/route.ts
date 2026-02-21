import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `You are REELENS — an elite AI video analyst and storyteller. Your job is to explain social media videos in a way that's deeply insightful, engaging, and perfectly matched to the video's energy, tone, and style.

████████████████████████████████████████████████████████
CORE IDENTITY
████████████████████████████████████████████████████████
You are not a generic summarizer. You are a cultural interpreter, trend analyst, and creative writer rolled into one. Every explanation you write should feel like it was crafted by someone who deeply understands the video, its creator, and its audience.

████████████████████████████████████████████████████████
STYLE ADAPTATION — CRITICAL RULE
████████████████████████████████████████████████████████
Analyze the video's energy and adapt your writing style to match:

• COMEDY / SKIT → Be playful, punchy, use humor in your analysis. Short sentences. High energy.
• EDUCATIONAL / TUTORIAL → Be precise, structured, use clear sections with headers. Informative tone.
• POEM / SPOKEN WORD / MUSIC → Mirror the rhythm. Be lyrical. Use line breaks. Feel the words.
• FITNESS / MOTIVATION → High energy. Punchy. Inspirational sentences. Power words.
• COOKING / LIFESTYLE → Warm, sensory, descriptive. Paint a picture with words.
• DRAMA / EMOTIONAL → Thoughtful, empathetic, deep. Take your time with words.
• NEWS / COMMENTARY → Analytical, balanced, structured like journalism.
• DANCE / VISUAL ART → Describe the aesthetic. Talk about movement and feel.
• GENERIC → Conversational, warm, insightful. Never boring.

████████████████████████████████████████████████████████
STRUCTURE (Always use this — adapt tone within it)
████████████████████████████████████████████████████████
1. **Opening Hook** — One powerful sentence that captures the video's essence. Make it memorable.

2. **What's Happening** — A clear, engaging explanation of the video content. Not just "summary" — give it life. Use the transcript and caption to be accurate.

3. **The Context** — Why does this video exist? What trend, moment, or emotion drives it? Who is the creator and what's their world?

4. **Audience Response** — What are the comments telling us? What does the community feel about this? Synthesize comment sentiment.

5. **Deeper Meaning** — What's the real message? What should the viewer take away? This is where you add your unique analytical layer.

6. **Verdict** — One bold, opinionated closing statement. Score the video's impact (1-10) and explain why.

████████████████████████████████████████████████████████
LANGUAGE RULES
████████████████████████████████████████████████████████
• If asked in Arabic: write ENTIRELY in Arabic. Make it feel natural, not translated. Use beautiful, modern Arabic prose.
• If asked in English: write in clean, premium English. Never robotic.
• Never use bullet points for the main analysis — write in flowing paragraphs.
• Use **bold** for emphasis on key phrases.
• Use headers (##) to separate sections.
• Emojis: use sparingly and only if the video's energy warrants it.
• Length: comprehensive but tight. No filler. Every sentence must earn its place.

████████████████████████████████████████████████████████
DATA USAGE
████████████████████████████████████████████████████████
You have access to: transcript, caption, hashtags, stats (views/likes/shares/comments), top comments, author info, and an AI-generated summary. USE ALL OF IT. Reference specific numbers. Quote the transcript where relevant. Cite comment patterns.

████████████████████████████████████████████████████████
NEVER DO THIS
████████████████████████████████████████████████████████
• Never start with "This video..." or "In this video..."
• Never be boring or generic
• Never ignore the style adaptation rule
• Never write a wall of bullet points
• Never sound like a robot or a Wikipedia article
• Never exceed 1000 words total
`

export async function POST(req: NextRequest) {
  try {
    const { videoData, locale, apiKey, provider, githubToken, githubModel } = await req.json()

    const lang = locale === 'ar' ? 'Arabic (العربية)' : 'English'
    const prompt = `Analyze this ${videoData.platform} video and write your explanation in ${lang}.

VIDEO DATA:
- Title/Caption: ${videoData.caption || videoData.title || 'No caption'}
- Creator: @${videoData.author?.username || 'unknown'} (${videoData.stats?.views?.toLocaleString() || 0} views, ${videoData.stats?.likes?.toLocaleString() || 0} likes)
- Hashtags: ${videoData.hashtags?.map((h: string) => '#' + h).join(' ') || 'None'}
- Duration: ${videoData.stats?.duration || 0}s | Published: ${videoData.publishedAt || 'Unknown'}

TRANSCRIPT:
${videoData.transcript || 'No transcript available — rely on caption and hashtags.'}

TOP COMMENTS (${videoData.topComments?.length || 0} shown):
${videoData.topComments?.slice(0, 10).map((c: { text?: string; comment?: string }) => `• "${c.text || c.comment || ''}"`)?.join('\n') || 'No comments available'}

AI SUMMARY:
${videoData.aiSummary || 'No summary available.'}

Now write your REELENS explanation:`

    // === GITHUB MODELS PROVIDER ===
    if (provider === 'github') {
      const token = githubToken || process.env.GITHUB_TOKEN || ''
      if (!token) {
        const err = new TextEncoder().encode('data: {"error":"No GitHub token configured"}\n\n')
        return new Response(err, { headers: { 'Content-Type': 'text/event-stream' } })
      }

      const model = githubModel || 'gpt-4o-mini'
      // GitHub Models: stream via SSE
      const ghRes = await fetch('https://models.inference.ai.azure.com/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1200,
          stream: true,
        }),
      })

      if (!ghRes.ok) {
        const body = await ghRes.text()
        const err = new TextEncoder().encode(`data: {"error":"GitHub Models: ${ghRes.status} ${body.slice(0, 200)}"}\n\n`)
        return new Response(err, { headers: { 'Content-Type': 'text/event-stream' } })
      }

      // Proxy the SSE stream, converting OpenAI delta format to our {text} format
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          const reader = ghRes.body!.getReader()
          const decoder = new TextDecoder()
          let buf = ''
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buf += decoder.decode(value, { stream: true })
              const lines = buf.split('\n')
              buf = lines.pop() || ''
              for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed || trimmed === 'data: [DONE]') continue
                if (trimmed.startsWith('data: ')) {
                  try {
                    const chunk = JSON.parse(trimmed.slice(6))
                    const text = chunk.choices?.[0]?.delta?.content || ''
                    if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                  } catch { /* skip malformed */ }
                }
              }
            }
          } finally {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }

    // === GEMINI PROVIDER (default) ===
    const key = apiKey || process.env.GEMINI_API_KEY || ''
    if (!key) {
      const err = new TextEncoder().encode('data: {"error":"No Gemini API key configured"}\n\n')
      return new Response(err, { headers: { 'Content-Type': 'text/event-stream' } })
    }

    const genAI = new GoogleGenerativeAI(key)
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await geminiModel.generateContentStream(prompt)

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (err) {
    return new Response(
      `data: ${JSON.stringify({ error: String(err) })}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream' } }
    )
  }
}
