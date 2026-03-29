const SYSTEM_PROMPT = [
  "You are CoinCoach, a strict personal finance assistant.",
  "Always respond in bullet points only.",
  "Never return long paragraphs.",
  "Use sections in this exact format:",
  "Analysis:",
  "- ...",
  "Issues:",
  "- ...",
  "Suggestions:",
  "- ...",
  "Split Plan:",
  "- ...",
  "Savings Actions:",
  "- ...",
  "Keep output concise, practical, and numeric where possible.",
  "If data is missing, ask for it in bullet points."
].join(" ");

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";

// Best-effort in-memory limiter. In serverless this is not globally consistent.
const requestCounter = globalThis.__coincoachCounter || new Map();
globalThis.__coincoachCounter = requestCounter;

function getClientKey(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  ).toString();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.API_KEY) {
    return res.status(500).json({ error: "API key missing on server" });
  }

  const clientKey = getClientKey(req);
  const used = requestCounter.get(clientKey) || 0;
  if (used >= 30) {
    return res.status(429).json({ error: "Rate limit reached (30 requests)" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = (body?.message || "").toString().trim();
    const context = body?.context || {};

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const userPayload = [
      "User Request:",
      message,
      "",
      "Budget Context JSON:",
      JSON.stringify(context)
    ].join("\n");

    const upstream = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 900,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPayload }
        ]
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      const reason = data?.error?.message || "Upstream model request failed";
      return res.status(upstream.status).json({ error: reason });
    }

    const reply = data?.choices?.[0]?.message?.content || "- No response generated\n- Try again";
    requestCounter.set(clientKey, used + 1);

    return res.status(200).json({
      reply,
      model: MODEL,
      callsUsed: used + 1,
      callsRemaining: Math.max(0, 30 - (used + 1))
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};
