// MotionOS Command Center — Scheduled Monitor
// Runs on interval to check project health and generate alerts

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const MONITOR_PROMPT = `You are the automated monitoring agent for MotionOS Command Center.

Generate a JSON health report for the MotionOS project. Analyze the current state and produce alerts.

Return ONLY valid JSON in this format:
{
  "timestamp": "ISO date string",
  "status": "healthy | warning | critical",
  "alerts": [
    {
      "severity": "info | warning | error | success",
      "category": "tests | deploy | sprint | agents | envelopes",
      "message": "Short alert message",
      "recommendation": "What to do about it"
    }
  ],
  "metrics": {
    "sprintProgress": number (0-100),
    "testsPassing": number,
    "testsTotal": number,
    "activeAgents": number,
    "deploymentsHealthy": number,
    "formEnvelopesComplete": number
  },
  "summary": "One sentence overall status"
}`;

export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers }
    );
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: MONITOR_PROMPT,
        messages: [
          {
            role: "user",
            content: `Generate health report for ${new Date().toISOString()}. Check: sprint velocity, test health, deployment status, agent activity, FormEnvelope coverage.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Monitor check failed: ${response.status}` }),
        { status: response.status, headers }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "{}";

    return new Response(content, { status: 200, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Monitor error", details: error.message }),
      { status: 500, headers }
    );
  }
};

export const config = {
  schedule: "@hourly",
};
