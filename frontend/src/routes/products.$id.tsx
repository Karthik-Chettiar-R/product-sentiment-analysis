import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SentimentBadge, SentimentBar, Stars } from "@/components/Sentiment";
import { api } from "@/lib/api";
import { summarize, type Sentiment } from "@/lib/data";
import { useRole } from "@/lib/store";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "Product reviews — Review Sentiment" },
      { name: "description", content: "Review-by-review sentiment and aggregate rating." },
      { property: "og:title", content: "Product reviews — Review Sentiment" },
      { property: "og:description", content: "Review-by-review sentiment and aggregate rating." },
    ],
  }),
  component: ProductPage,
});

const border: Record<Sentiment, string> = {
  positive: "border-l-positive bg-positive/5",
  neutral: "border-l-neutral-s bg-neutral-s/5",
  negative: "border-l-negative bg-negative/5",
};

function ProductPage() {
  const { id } = Route.useParams();
  const role = useRole();
  const [hydrated, setHydrated] = useState(false);
  const queryClient = useQueryClient();
  const productQuery = useQuery({
    queryKey: ["products", id],
    queryFn: () => api.getProduct(id),
    enabled: hydrated,
  });
  const addReview = useMutation({
    mutationFn: (review: { text: string; rating: number }) => api.createReview(id, review),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products", id] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
  });
  const product = productQuery.data;

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || productQuery.isLoading) {
    return <p className="p-12 text-center text-muted-foreground">Loading product…</p>;
  }
  if (productQuery.error) {
    const missing = productQuery.error.message.toLowerCase().includes("not found");
    return (
      <div className="p-12 text-center">
        <p role={missing ? undefined : "alert"}>
          {missing ? "Product not found." : productQuery.error.message}
        </p>
        <Link to="/" className="mt-3 inline-block underline">
          Back to products
        </Link>
      </div>
    );
  }
  if (!product) return null;

  const summary = summarize(product);
  const aspectGroups = new Map<
    string,
    {
      aspect: string;
      count: Record<Sentiment, number>;
      reviews: { text: string; sentiment: Sentiment; confidence: number }[];
    }
  >();
  for (const review of product.reviews) {
    for (const aspect of review.aspects ?? []) {
      const normalizedAspect = aspect.aspect
        .normalize("NFKC")
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
        .replace(/\s+/g, " ");
      if (!normalizedAspect) continue;

      const key = normalizedAspect.replace(/^(the|a|an)\s+/u, "");
      const group = aspectGroups.get(key) ?? {
        aspect: aspect.aspect.trim(),
        count: { positive: 0, neutral: 0, negative: 0 },
        reviews: [],
      };
      group.count[aspect.sentiment] += 1;
      group.reviews.push({
        text: review.text,
        sentiment: aspect.sentiment,
        confidence: aspect.confidence,
      });
      aspectGroups.set(key, group);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        to="/"
        className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        ← All products
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_280px]">
        <div>
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="mb-6 max-h-72 w-full rounded-xl border bg-card object-contain"
            />
          )}
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {product.category || "Product"}
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">
            {product.name}
          </h1>
          {typeof product.price === "number" && (
            <p className="mt-2 text-muted-foreground">
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              }).format(product.price)}
            </p>
          )}
          <p className="mt-2 text-muted-foreground">
            {summary.classified} of {summary.n} reviews classified
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            User-given rating
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-4xl font-semibold">
              {summary.n ? summary.userRating.toFixed(1) : "—"}
            </span>
            <span className="text-muted-foreground">/ 5 · average stars</span>
          </div>
          <div className="mt-5 border-t pt-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Sentiment-derived rating
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold">
                {summary.classified ? summary.sentimentRating.toFixed(1) : "—"}
              </span>
              <span className="text-muted-foreground">/ 5 · from classified reviews</span>
            </div>
          </div>
          <div className="mt-2">
            <SentimentBadge s={summary.overall} />
          </div>
          <div className="mt-4">
            <SentimentBar count={summary.count} n={summary.classified} />
          </div>
          <ul className="mt-3 space-y-1 font-mono text-xs">
            <li className="flex justify-between text-positive">
              <span>Positive</span>
              <span>{summary.count.positive}</span>
            </li>
            <li className="flex justify-between text-neutral-s">
              <span>Neutral</span>
              <span>{summary.count.neutral}</span>
            </li>
            <li className="flex justify-between text-negative">
              <span>Negative</span>
              <span>{summary.count.negative}</span>
            </li>
          </ul>
        </div>
      </div>

      {role === "buyer" && <ReviewForm busy={addReview.isPending} onSubmit={addReview.mutateAsync} />}
      {addReview.error && (
        <p role="alert" className="mt-4 rounded-lg border border-negative/40 bg-negative/5 p-4 text-negative">
          {addReview.error.message}
        </p>
      )}
      {role === "seller" && (
        <section className="mt-10" aria-labelledby="aspect-analysis-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="aspect-analysis-heading" className="font-display text-2xl font-semibold">
              Aspect analysis
            </h2>
            <p className="text-sm text-muted-foreground">
              Reviews grouped by the product aspect they discuss
            </p>
          </div>
          {aspectGroups.size === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              No aspect-level reviews are available for this product yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[...aspectGroups.entries()].map(([key, group]) => {
                const total = group.reviews.length;
                const sentimentRating =
                  (group.count.positive * 5 +
                    group.count.neutral * 3 +
                    group.count.negative) /
                  total;
                const dominantSentiment: Sentiment =
                  sentimentRating >= 3.7
                    ? "positive"
                    : sentimentRating >= 2.6
                      ? "neutral"
                      : "negative";

                return (
                  <section key={key} className="rounded-xl border bg-card p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold">{group.aspect}</h3>
                        <span className="font-mono text-xs text-muted-foreground">
                          {total} {total === 1 ? "review" : "reviews"} aggregated
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          Sentiment score
                        </p>
                        <p className="font-display text-2xl font-semibold">
                          {sentimentRating.toFixed(1)}
                          <span className="ml-1 font-mono text-xs text-muted-foreground">/ 5</span>
                        </p>
                        <SentimentBadge s={dominantSentiment} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <SentimentBar count={group.count} n={total} />
                    </div>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      <span className="text-positive">{group.count.positive} positive</span>
                      {" · "}
                      <span className="text-neutral-s">{group.count.neutral} neutral</span>
                      {" · "}
                      <span className="text-negative">{group.count.negative} negative</span>
                    </p>
                    <ul className="mt-4 space-y-3">
                      {group.reviews.map((item, index) => (
                        <li
                          key={`${item.text}-${index}`}
                          className={`rounded-md border border-l-4 p-3 ${border[item.sentiment]}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <SentimentBadge s={item.sentiment} />
                            <span className="font-mono text-xs text-muted-foreground">
                              {Math.round(item.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                            {item.text}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </section>
      )}
      {summary.n === 0 && (
        <p className="mt-10 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No reviews yet.
        </p>
      )}
      <ul className="mt-10 space-y-4">
        {product.reviews.map((review, index) => (
          <li
            key={`${review.text}-${index}`}
            className={`rounded-lg border border-l-4 p-5 ${border[review.sentiment]}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{review.author || "Customer"}</span>
                {typeof review.rating === "number" && <Stars value={review.rating} />}
                {review.date && (
                  <span className="font-mono text-xs text-muted-foreground">{review.date}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {typeof review.confidence === "number" && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {Math.round(review.confidence * 100)}% conf.
                  </span>
                )}
                {review.sentiment ? (
                  <SentimentBadge s={review.sentiment} />
                ) : (
                  <span className="font-mono text-xs uppercase text-muted-foreground">
                    Unanalysed
                  </span>
                )}
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed">{review.text}</p>
            {(review.aspects?.length ?? 0) > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Aspect sentiment">
                {review.aspects.map((aspect, aspectIndex) => (
                  <li
                    key={`${aspect.aspect}-${aspectIndex}`}
                    className="flex items-center gap-2 rounded-md border bg-background/70 px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-medium">{aspect.aspect}</span>
                    <SentimentBadge s={aspect.sentiment} />
                    <span className="text-muted-foreground">
                      {Math.round(aspect.confidence * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

function ReviewForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (review: { text: string; rating: number }) => Promise<unknown>;
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!text.trim()) return;
        setDone(false);
        try {
          await onSubmit({ rating, text: text.trim() });
          setText("");
          setDone(true);
        } catch {
          // The mutation error is rendered by the parent component.
        }
      }}
      className="mt-10 space-y-3 rounded-xl border bg-card p-6"
    >
      <h2 className="font-display text-xl font-semibold">Write a review</h2>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setRating(value)}
              aria-label={`${value} stars`}
              aria-pressed={value === rating}
              className={`text-2xl ${value <= rating ? "text-accent-foreground" : "text-muted-foreground/40"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <textarea
        required
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setDone(false);
        }}
        placeholder="What did you think of this product?"
        aria-label="Review text"
        rows={4}
        className="w-full rounded-md border bg-background px-3 py-2"
      />
      <div className="flex items-center gap-3">
        <button
          disabled={busy}
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Analysing sentiment…" : "Submit review"}
        </button>
        {done && <span className="text-sm text-muted-foreground">Review added.</span>}
      </div>
    </form>
  );
}
