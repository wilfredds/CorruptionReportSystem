/**
 * CycleMind AI — Cloud Functions (server-side Claude proxy).
 *
 * WHY THIS EXISTS (architectural decision):
 * The Claude API key must never ship inside the mobile app. These HTTPS
 * functions hold the key (set via `firebase functions:config` or a secret) and
 * call Claude on the device's behalf, returning structured JSON. The Flutter
 * `ClaudeAiService` / `ClaudeVisionService` post to these endpoints.
 *
 * Set the key before deploy:
 *   firebase functions:secrets:set ANTHROPIC_API_KEY
 *
 * NOTE: This is a reference implementation. Add auth (verify the Firebase ID
 * token), rate limiting, and input validation before production use.
 */
import Anthropic from "@anthropic-ai/sdk";
import { onRequest } from "firebase-functions/v2/https";

const MODEL = "claude-sonnet-4-6";

function client(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/** Extracts the first text block from a Claude response. */
function textOf(msg: Anthropic.Message): string {
  const block = msg.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

/** Best-effort JSON parse of a model reply (handles ```json fences). */
function parseJson<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

const json = (res: any, body: unknown) =>
  res.set("Content-Type", "application/json").status(200).send(body);

/** POST /summarizeRide { ride, history } -> { headline, bullets } */
export const summarizeRide = onRequest(
  { secrets: ["ANTHROPIC_API_KEY"] },
  async (req, res) => {
    const { ride, history } = req.body ?? {};
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 600,
      system:
        "You are an expert cycling coach. Given ride data, respond ONLY with " +
        'JSON: {"headline": string, "bullets": string[]} — concise, actionable.',
      messages: [
        {
          role: "user",
          content: `Ride: ${JSON.stringify(ride)}\nRecent history: ${JSON.stringify(
            history ?? []
          )}`,
        },
      ],
    });
    json(res, parseJson(textOf(msg), { headline: "", bullets: [] }));
  }
);

/** POST /weeklyInsight { rides } -> { headline, bullets } */
export const weeklyInsight = onRequest(
  { secrets: ["ANTHROPIC_API_KEY"] },
  async (req, res) => {
    const { rides } = req.body ?? {};
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 600,
      system:
        "You are a cycling coach. Summarise the week's training. Respond ONLY " +
        'with JSON {"headline": string, "bullets": string[]}.',
      messages: [
        { role: "user", content: `Rides this week: ${JSON.stringify(rides ?? [])}` },
      ],
    });
    json(res, parseJson(textOf(msg), { headline: "", bullets: [] }));
  }
);

/** POST /readinessAdvice { score, sleep, recovery, fatigue } -> { advice } */
export const readinessAdvice = onRequest(
  { secrets: ["ANTHROPIC_API_KEY"] },
  async (req, res) => {
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 200,
      system: "You are a recovery coach. Give one or two sentences of advice.",
      messages: [{ role: "user", content: JSON.stringify(req.body ?? {}) }],
    });
    json(res, { advice: textOf(msg) });
  }
);

/** POST /generateTrainingPlan { level, goal } -> structured plan */
export const generateTrainingPlan = onRequest(
  { secrets: ["ANTHROPIC_API_KEY"] },
  async (req, res) => {
    const { level, goal } = req.body ?? {};
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 2000,
      system:
        "You are a cycling coach. Build a 4-week plan. Respond ONLY with JSON: " +
        '{"id":string,"summary":string,"weeks":[{"weekNumber":number,"focus":string,' +
        '"days":[{"dayLabel":string,"title":string,"description":string,"durationMin":number,"isRest":boolean}]}]}',
      messages: [
        { role: "user", content: `Level: ${level}. Goal: ${goal}.` },
      ],
    });
    json(res, parseJson(textOf(msg), { id: "plan", summary: "", weeks: [] }));
  }
);

/** POST /mechanicChat { message, history } -> { reply } */
export const mechanicChat = onRequest(
  { secrets: ["ANTHROPIC_API_KEY"] },
  async (req, res) => {
    const { message, history } = req.body ?? {};
    const turns = (history ?? []).map((t: { role: string; text: string }) => ({
      role: t.role === "user" ? "user" : "assistant",
      content: t.text,
    }));
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 700,
      system:
        "You are an expert bike mechanic. Ask clarifying questions when needed, " +
        "then give a clear, safe, step-by-step diagnosis.",
      messages: [...turns, { role: "user", content: message }],
    });
    json(res, { reply: textOf(msg) });
  }
);

/** POST /analyzeBike { part, imageBase64 } -> structured health report */
export const analyzeBike = onRequest(
  { secrets: ["ANTHROPIC_API_KEY"], memory: "512MiB" },
  async (req, res) => {
    const { part, imageBase64 } = req.body ?? {};
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 1500,
      system:
        "You are a bicycle inspection AI. Analyse the photo of the bike " +
        `area "${part}". Respond ONLY with JSON: {"healthScore":number(0-100),` +
        '"riskLevel":"low"|"medium"|"high","summary":string,' +
        '"findings":[{"area":string,"issue":string,"severity":"low"|"medium"|"high","suggestions":string[]}]}',
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            { type: "text", text: "Inspect this and report issues." },
          ],
        },
      ],
    });
    json(
      res,
      parseJson(textOf(msg), {
        healthScore: 0,
        riskLevel: "low",
        summary: "",
        findings: [],
      })
    );
  }
);
