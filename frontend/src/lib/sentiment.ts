import type { Sentiment } from "./data";

/**
 * Sentiment classifier entry point. Replace the body with a call to the
 * BERT model endpoint, e.g.:
 *   const res = await fetch(BERT_URL, { method: "POST", body: JSON.stringify({ text }) });
 *   return await res.json(); // { sentiment, confidence }
 * Until then a simple word-list stand-in is used.
 */
export async function classifySentiment(text: string): Promise<{ sentiment: Sentiment; confidence: number }> {
  const pos = ["good", "great", "love", "excellent", "amazing", "best", "fantastic", "perfect", "happy", "awesome", "recommend", "comfortable", "nice", "fast", "lovely"];
  const neg = ["bad", "poor", "terrible", "worst", "broke", "broken", "disappointed", "hate", "awful", "waste", "slow", "stopped", "cracked", "refund", "useless", "not"];
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  let score = 0;
  for (const w of words) { if (pos.includes(w)) score++; if (neg.includes(w)) score--; }
  await new Promise((r) => setTimeout(r, 400));
  const sentiment: Sentiment = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
  const confidence = Math.min(0.99, 0.6 + Math.abs(score) * 0.1);
  return { sentiment, confidence };
}
