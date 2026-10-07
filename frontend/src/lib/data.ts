export type Sentiment = "positive" | "neutral" | "negative";

export type Aspect = {
  aspect: string;
  sentiment: Sentiment;
  confidence: number;
};

export type Review = {
  text: string;
  rating?: number;
  sentiment: Sentiment | null;
  confidence?: number;
  aspects?: Aspect[];
  author?: string;
  date?: string;
};

export type Product = {
  id: string;
  name: string;
  price?: number;
  image: string | null;
  rating?: number;
  reviews: Review[];
  category?: string;
};

export function summarize(product: Product) {
  const count: Record<Sentiment, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  for (const review of product.reviews) {
    if (review.sentiment) count[review.sentiment] += 1;
  }

  const n = product.reviews.length;
  const classified = count.positive + count.neutral + count.negative;
  const userRating = typeof product.rating === "number" && Number.isFinite(product.rating)
    ? product.rating
    : 0;
  const sentimentRating = classified
    ? (count.positive * 5 + count.neutral * 3 + count.negative) / classified
    : 0;
  const overall: Sentiment = !classified
    ? "neutral"
    : sentimentRating >= 3.7
      ? "positive"
      : sentimentRating >= 2.6
        ? "neutral"
        : "negative";

  return {
    n,
    classified,
    count,
    userRating,
    sentimentRating: Math.round(sentimentRating * 10) / 10,
    overall,
  };
}
