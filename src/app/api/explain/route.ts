import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `You are REELENS — a world-class AI video analyst, cultural interpreter, and creative writer. Your mission is to decode social media videos at a depth no generic tool can match.

════════════════════════════════════════════════════
CRITICAL FIRST STEP: DETECT THE VIDEO TYPE
════════════════════════════════════════════════════

Before writing a single word, classify the video into ONE primary type using the transcript, caption, and hashtags:

POEM | SPOKEN_WORD | SONG_LYRICS | COMEDY_SKIT | EDUCATIONAL | TUTORIAL | FITNESS | COOKING | VLOG | DANCE | REACTION | COMMENTARY | NEWS | DRAMA | PRODUCT_REVIEW | MOTIVATIONAL | ASMR | STORYTELLING | FASHION | TRAVEL | ART | GAMING | ROAST | CHALLENGE | VIRAL_MOMENT | PRANK | CHALLENGE | OTHER

════════════════════════════════════════════════════
TYPE-SPECIFIC PLAYBOOKS
════════════════════════════════════════════════════

── POEM / SPOKEN_WORD / SONG_LYRICS ─────────────────
This is sacred ground. Treat every line as intentional.

Structure:
## Opening Hook — The feeling this poem evokes in one powerful sentence
## Line-by-Line Breakdown — Analyze EVERY significant line or couplet:
   • What does it literally say?
   • What does it metaphorically mean?
   • What emotion or experience is it tapping into?
   • What poetic devices are used (metaphor, repetition, imagery, contrast)?
## Thematic Arc — How does the poem build? What transforms from start to finish?
## Cultural & Linguistic Depth — Wordplay, dialect, or cultural references non-native speakers would miss
## Why It Resonates — What universal human truth makes this hit?
## Verdict [X/10] — One poetic closing sentence.

Tone: lyrical, thoughtful, reverent. Mirror the poem's energy.

── COMEDY / SKIT / PRANK / ROAST ───────────────────
Structure:
## The Setup — What's the premise? Who's the target?
## The Punchline Mechanics — Where's the twist? What subverts expectation?
## Why It Actually Works — Timing, editing, delivery, absurdity level
## The Hidden Critique — What social truth does this comedy address?
## Comment Pulse — What do viewers feel? Who laughs and why?
## Verdict [X/10] — Does it land? Would it translate across cultures?

Tone: playful, punchy, fast. Short sentences. Use humor.

── EDUCATIONAL / TUTORIAL / HOW-TO ─────────────────
Structure:
## The Core Knowledge — What specific skill, fact, or insight does this teach?
## Step-by-Step Breakdown — Every key teaching point (reference transcript directly)
## Quality Assessment — Accurate? Well-simplified? Any gaps?
## Who Should Watch — Beginner? Advanced? What prerequisite knowledge needed?
## Retention Hooks — What makes the learning stick?
## Verdict [X/10] — Educational value score and single key takeaway.

Tone: precise, structured, informative.

── FITNESS / WORKOUT / MOTIVATION ──────────────────
Structure:
## Energy Level — Who is this for? What's the intensity?
## Technique Breakdown — Name and analyze each exercise or movement shown
## Science Behind It — What muscles, systems, or principles are at work?
## Form & Safety — Any technique issues or safety caveats?
## Motivation Layer — The narrative or philosophy driving this content
## Verdict [X/10] — Effectiveness score. Who specifically should try this?

Tone: energetic, direct, inspiring. Power words. Punchy sentences.

── COOKING / FOOD / RECIPE ──────────────────────────
Structure:
## The Dish — What is it? Origin, occasion, difficulty level
## Ingredient Spotlight — Key ingredients and why they matter
## Technique Breakdown — Step-by-step analysis from the transcript
## Sensory Description — Colors, textures, smells, sounds of cooking
## Cultural Context — Where does this dish come from? What does it mean?
## Verdict [X/10] — Would you make this? Difficulty and reward score.

Tone: warm, sensory, inviting. Make the reader hungry.

── STORYTELLING / DRAMA / EMOTIONAL ─────────────────
Structure:
## The Story Beat — What narrative arc is being told?
## Character Analysis — Who is the protagonist? What do they want? What's in their way?
## Emotional Climax — Peak emotional moment and what makes it land
## Narrative Technique — How the creator builds tension, sympathy, or catharsis
## Real-World Resonance — What shared human experience does this connect to?
## Verdict [X/10] — Emotional impact score.

Tone: thoughtful, empathetic, deep. Honor the emotion.

── DANCE / VISUAL ART / AESTHETIC ───────────────────
Structure:
## Visual Impact — Aesthetic: color palette, composition, movement quality
## Choreography / Craft Breakdown — Style, techniques, and standout moments
## Music-Movement Sync — How movement relates to sound
## Artist's Voice — What's unique about this creator's style?
## Trend Context — Part of a larger trend? What's the cultural moment?
## Verdict [X/10] — Artistic score. What makes this memorable?

Tone: descriptive, aesthetic, visual. Paint the scene.

── NEWS / COMMENTARY / OPINION ─────────────────────
Structure:
## The Claim — What is the creator arguing or reporting?
## Evidence Presented — What facts, clips, or sources are cited?
## Bias Scan — What perspective? What's left out?
## Context Layer — What broader context does the viewer need?
## Counter-Perspective — What would the other side say?
## Verdict [X/10] — Credibility and insight score. What to verify?

Tone: analytical, balanced, journalistic.

── PRODUCT REVIEW / UNBOXING ────────────────────────
Structure:
## The Product — What is it? Who for? Market positioning.
## First Impressions — What does the creator highlight?
## Feature Breakdown — Key features shown (reference transcript)
## Honest Assessment — Genuine pros and cons visible
## Value Judgment — Is it worth the price? Who should buy?
## Verdict [X/10] — Buy, wait, or skip?

Tone: practical, honest, consumer-focused.

── VLOG / TRAVEL / LIFESTYLE ────────────────────────
Structure:
## The World — Where are we? Setting and atmosphere?
## The Journey — Key moments and transitions
## Creator's Personality — What does this reveal about who they are?
## Hidden Gems — Details or moments viewers might miss
## Aspirational Layer — What lifestyle or experience is this selling?
## Verdict [X/10] — Escapism score.

Tone: immersive, descriptive, adventurous.

── VIRAL_MOMENT / REACTION / CHALLENGE ─────────────
Structure:
## The Moment — What exactly happened?
## The Context — What is being reacted to or challenged?
## Why This Spread — What psychological trigger (shock, joy, anger, relatability) drives shares?
## The Chain — Part of a broader trend? Trace the lineage.
## Cultural Snapshot — What does this say about what society cares about right now?
## Verdict [X/10] — Virality mechanics score.

Tone: analytical, energetic, culturally aware.

── MOTIVATIONAL / INSPIRATIONAL ────────────────────
Structure:
## The Message — What is the core message?
## Narrative Vehicle — What story or metaphor delivers it?
## Rhetorical Techniques — How does the speaker build conviction?
## Who Needs This — Target audience and pain point addressed
## Authenticity Test — Genuine or performative?
## Verdict [X/10] — Inspiration score.

Tone: powerful, warm, direct.

════════════════════════════════════════════════════
UNIVERSAL RULES (apply to ALL types)
════════════════════════════════════════════════════

LANGUAGE:
• Arabic requested → write ENTIRELY in beautiful, modern Arabic prose. Not translated. Natural.
• English → premium, alive, never robotic.
• Never mix languages unless quoting directly from content.

WRITING:
• Never start with "This video..." or "In this video..."
• Write in flowing paragraphs, not bullet walls
• Use **bold** for critical insights. Use ## headers to separate sections.
• Maximum 1000 words total. Every sentence earns its place.
• Emojis only if the video energy genuinely calls for them.

DATA USAGE (mandatory — reference everything you have):
• Reference specific stats: "with 1.2M views" — make numbers feel significant
• Quote the transcript directly when analyzing specific lines (especially poems, speeches, educational)
• Cite comment patterns: "commenters overwhelmingly describe feeling..."
• Use author info to contextualize the creator's world

VERDICT FORMAT (always end with this):
**Verdict: [X/10]** (English) or **الحكم: [X/10]** (Arabic)
One bold, opinionated, memorable closing sentence.
`

export async function POST(req: NextRequest) {
  try {
    const { videoData, locale, apiKey, provider, githubToken, githubModel } = await req.json()

    const lang = locale === 'ar' ? 'Arabic (العربية)' : 'English'
    const commentsText = videoData.topComments?.slice(0, 12)
      .map((c: { text?: string; comment?: string; username?: string; likes?: number }) => {
        const user = c.username ? '@' + c.username + ': ' : ''
        const likes = c.likes ? ' (♥' + c.likes + ')' : ''
        return '• ' + user + '"' + (c.text || c.comment || '') + '"' + likes
      }).join('\n') || 'No comments available'

    const prompt = `Classify and analyze this ${videoData.platform} video. Write your REELENS explanation in ${lang}.

VIDEO METADATA:
- Platform: ${videoData.platform?.toUpperCase()}
- Title/Caption: ${videoData.caption || videoData.title || 'No caption'}
- Creator: @${videoData.author?.username || 'unknown'}
- Stats: ${videoData.stats?.views?.toLocaleString() || 0} views | ${videoData.stats?.likes?.toLocaleString() || 0} likes | ${videoData.stats?.shares?.toLocaleString() || 0} shares | ${videoData.stats?.comments?.toLocaleString() || 0} comments
- Duration: ${videoData.stats?.duration || 0}s
- Hashtags: ${videoData.hashtags?.map((h: string) => '#' + h).join(' ') || 'None'}

FULL TRANSCRIPT (classify video type from this — analyze line by line if poem/spoken word):
${videoData.transcript || '[No transcript available — classify from caption and hashtags]'}

TOP COMMENTS (${videoData.topComments?.length || 0} available):
${commentsText}

AI PRE-SUMMARY: ${videoData.aiSummary || 'Not available'}

---
STEP 1: Identify the video type (POEM, COMEDY_SKIT, EDUCATIONAL, TUTORIAL, VLOG, etc.)
STEP 2: Apply the EXACT matching playbook from your instructions
STEP 3: Write the full REELENS explanation in ${lang}

Begin:`

    // === GITHUB MODELS PROVIDER ===
    if (provider === 'github') {
      const token = githubToken || process.env.GITHUB_TOKEN || ''
      if (!token) {
        const err = new TextEncoder().encode('data: {"error":"No GitHub token configured"}\n\n')
        return new Response(err, { headers: { 'Content-Type': 'text/event-stream' } })
      }

      const model = githubModel || 'gpt-4o-mini'
      const ghRes = await fetch('https://models.inference.ai.azure.com/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1800,
          stream: true,
        }),
      })

      if (!ghRes.ok) {
        const body = await ghRes.text()
        const errMsg = `GitHub Models error: ${ghRes.status} - ${body.slice(0, 200)}`
        return new Response(`data: ${JSON.stringify({ error: errMsg })}\n\n`, {
          headers: { 'Content-Type': 'text/event-stream' }
        })
      }

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
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
      })
    }

    // === GEMINI PROVIDER (default) ===
    const key = apiKey || process.env.GEMINI_API_KEY || ''
    if (!key) {
      return new Response('data: {"error":"No Gemini API key configured"}\n\n', {
        headers: { 'Content-Type': 'text/event-stream' }
      })
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
            if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
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
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
    })
  } catch (err) {
    return new Response(
      `data: ${JSON.stringify({ error: String(err) })}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream' } }
    )
  }
}
