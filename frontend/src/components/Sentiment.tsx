import type { Sentiment } from "@/lib/data";

const cls: Record<Sentiment, string> = {
  positive: "bg-positive/15 text-positive border-positive/40",
  neutral: "bg-neutral-s/15 text-neutral-s border-neutral-s/40",
  negative: "bg-negative/15 text-negative border-negative/40",
};
export const barCls: Record<Sentiment, string> = { positive: "bg-positive", neutral: "bg-neutral-s", negative: "bg-negative" };

export function SentimentBadge({ s }: { s: Sentiment }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase tracking-wider ${cls[s]}`}><span className={`h-1.5 w-1.5 rounded-full ${barCls[s]}`} />{s}</span>;
}

export function SentimentBar({ count, n }: { count: Record<Sentiment, number>; n: number }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      {(["positive", "neutral", "negative"] as Sentiment[]).map((k) => (
        <div key={k} className={barCls[k]} style={{ width: `${n ? (count[k] / n) * 100 : 0}%` }} />
      ))}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  return <span className="font-mono text-sm text-accent-foreground">{"★".repeat(Math.round(value))}<span className="text-muted-foreground/40">{"★".repeat(5 - Math.round(value))}</span></span>;
}
