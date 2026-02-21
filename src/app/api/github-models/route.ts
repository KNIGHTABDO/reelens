import { NextRequest, NextResponse } from 'next/server'

const GH_MODELS_BASE = 'https://models.inference.ai.azure.com'

export async function POST(req: NextRequest) {
  try {
    const { action, token, model, messages, systemPrompt, stream } = await req.json()
    const ghToken = token || process.env.GITHUB_TOKEN || ''

    if (!ghToken) return NextResponse.json({ error: 'No GitHub token provided' }, { status: 400 })

    if (action === 'list') {
      // List available models from GitHub Models catalog
      const res = await fetch(`${GH_MODELS_BASE}/models`, {
        headers: {
          Authorization: `Bearer ${ghToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) {
        const body = await res.text()
        return NextResponse.json({ error: `GitHub API error: ${res.status} ${body.slice(0, 200)}` }, { status: res.status })
      }
      const data = await res.json()
      // data is an array of model objects
      const models = (Array.isArray(data) ? data : data.data || [])
        .filter((m: {friendly_name?: string; name?: string; id?: string; publisher?: string; task?: string}) => 
          m.task === 'chat-completion' || m.friendly_name || m.name
        )
        .map((m: {friendly_name?: string; name?: string; id?: string; publisher?: string}) => ({
          id: m.name || m.id || '',
          name: m.friendly_name || m.name || m.id || '',
          provider: m.publisher || '',
        }))
        .filter((m: {id: string}) => m.id)
      return NextResponse.json({ models })
    }

    if (action === 'chat') {
      // Non-streaming chat for GitHub Models
      const modelId = model || 'gpt-4o-mini'
      const msgs = []
      if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
      if (messages) msgs.push(...messages)

      const res = await fetch(`${GH_MODELS_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ghToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: msgs,
          max_tokens: 1200,
          stream: false,
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        return NextResponse.json({ error: `GitHub Models error: ${res.status} ${body.slice(0, 300)}` }, { status: res.status })
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || ''
      return NextResponse.json({ text })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
