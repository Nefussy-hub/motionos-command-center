// MotionOS Command Center — Claude API Proxy
// Netlify Function that connects the dashboard to Claude

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are the AI Command Center for MotionOS — a movement intelligence infrastructure platform.

You are embedded in the CTO's project monitoring dashboard. Your role is to provide real-time project intelligence, make recommendations, and help manage the development process.

## Project Context

MotionOS is "the perception layer beneath all fitness and training products" — infrastructure-as-a-service for movement analysis (like Stripe for payments, but for biomechanics).

### Core Moat (3 pillars):
1. **Form Envelope Database** — movement templates with 28+ skeletal nodes each
2. **Feedback Intelligence Layer (SilenceProtocolEngine)** — knows when NOT to correct (motor learning science)
3. **Movement Memory Engine** — tracks improvement over time

### Architecture:
- On-device processing ONLY (no video to cloud — non-negotiable)
- Hardware-agnostic (MediaPipe/MoveNet for pose estimation — commodity layer, not the moat)
- Layer independence: L0→L5 layers never cross-reference
- src/types/motionos.types.ts is FROZEN
- deploy/ directory is CTO-controlled

### Current State:
- Repository: Nefussy-hub/motionos-core (private)
- Live investor demo at motionos-core.vercel.app/investor.html
- Test suite: 1,323+ tests across 33+ files
- AI agent orchestration via Paperclip at 127.0.0.1:3100
- Team-1 (Core Engine): CTO-PRIME + 5 agents — Sprint 10
- Team-2 (Creator Platform): 3 agents — Sprint 9
- Team-3 (Consumer App): 3 agents — Sprint 9
- Team-4 (Platform Integration): Queued for Sprint 11+

### Key Decisions:
- Bridge Module over SDK Bundle (DEC-009) — fastest path for investor demo
- FormEnvelope minimum: 28 nodes, TypeScript strict, zero \`any\` types
- 15-second spacing between agent activations
- Backend agent activated first, then frontend, then growth

### GTM Sequence:
Consumer app → Creator SDK → Platform API → Hardware embed → Clinical module

### Exit Story:
Targets Google/YouTube, TikTok, Amazon, Apple, major sportswear brands

## Your Behavior:
- Be concise and actionable — this is a CTO command center, not a chatbot
- Lead with data and recommendations
- Flag risks proactively
- When asked about project state, reference specific sprint numbers, test counts, and deployment versions
- Think in terms of velocity, blockers, and critical path
- Use MotionOS terminology (FormEnvelope, SilenceProtocol, Bridge Module, etc.)
- Hebrew is fine — the founder speaks Hebrew`;

export default async (req) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers }
    );
  }

  try {
    const body = await req.json();
    const { messages, max_tokens = 1024 } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array required" }),
        { status: 400, headers }
      );
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: `Anthropic API error: ${response.status}`,
          details: errorText,
        }),
        { status: response.status, headers }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers }
    );
  }
};

export const config = {
  path: "/.netlify/functions/claude",
};
