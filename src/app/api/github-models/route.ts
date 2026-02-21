import { NextRequest, NextResponse } from 'next/server'

const GH_MODELS_BASE = 'https://models.inference.ai.azure.com'

export async function POST(req: NextRequest) {
  try {
    const { action, token, model, messages, stream } = await req.json()
    const ghToken = token || process.env.GITHUB_TOKEN || ''

    if (!ghToken) return NextResponse.json({ error: 'No GitHub token configured' }, { status: 400 })

    // --- List models ---
    if (action === 'list') {
      const res = await fetch(`${GH_MODELS_BASE}/models`, {
        headers: { Authorization: `Bearer ${ghToken}`, 'Content-Type': 'application/json' },
        next: { revalidate: 3600 },
      })
      if (!res.ok) {
        const body = await res.text()
        return NextResponse.json({ error: `GitHub Models API error: ${res.status} ${body.slice(0, 200)}` }, { status: res.status })
      }
      const data = await res.json()
      // Return just the model IDs + friendly names
      const models = (Array.isArray(data) ? data : data.data || data.models || []).map((m: Record<string, string>) => ({
        id: m.id || m.name,
        name: m.friendly_name || m.display_name || m.id || m.name,
        provider: m.publisher || m.provider || '',
      }))
      return NextResponse.json({ models })
    }

    // --- Chat completion (streaming) ---
    if (action === 'chat') {
      if (!model || !messages?.length) {
        return NextResponse.json({ error: 'model and messages required' }, { status: 400 })
      }

      const res = await fetch(`${GH_MODELS_BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ghToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true, max_tokens: 1500 }),
      })

      if (!res.ok) {
        const body = await res.text()
        return new Response(
          `data: ${JSON.stringify({ error: `GitHub Models error: ${res.status} ${body.slice(0, 300)}` })}\n\n`,
          { headers: { 'Content-Type': 'text/event-stream' } }
        )
      }

      // Forward SSE stream
      const readableStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          const reader = res.body!.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const payload = line.slice(6).trim()
                  if (payload === '[DONE]') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    continue
                  }
                  try {
                    const chunk = JSON.parse(payload)
                    const text = chunk.choices?.[0]?.delta?.content || ''
                    if (text) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                    }
                  } catch { /* skip malformed */ }
                }
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

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
