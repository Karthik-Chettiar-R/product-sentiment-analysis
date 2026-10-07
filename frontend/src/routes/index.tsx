import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SentimentBadge, SentimentBar } from "@/components/Sentiment";
import { api } from "@/lib/api";
import { summarize } from "@/lib/data";
import { useRole } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Products — Seller Review Sentiment Dashboard" },
      {
        name: "description",
        content: "Seller dashboard of products and their classified review sentiment.",
      },
      { property: "og:title", content: "Products — Seller Review Sentiment Dashboard" },
      {
        property: "og:description",
        content: "Seller dashboard of products and their classified review sentiment.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const queryClient = useQueryClient();
  const role = useRole();
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: api.getProducts,
    enabled: hydrated,
  });
  const createProduct = useMutation({
    mutationFn: api.createProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setName("");
      setPrice("");
      setImage("");
      setOpen(false);
    },
  });
  const deleteProduct = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
  const products = productsQuery.data ?? [];
  const allReviews = products.flatMap((product) => product.reviews);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {role === "seller" ? "Seller" : "Buyer"} · Hindi & English sentiment
      </p>
      <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">Products</h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground">
          {products.length} products · {allReviews.length} reviews analysed
        </p>
        {role === "seller" && (
          <button
            onClick={() => setOpen(!open)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {open ? "Cancel" : "+ Add product"}
          </button>
        )}
      </div>

      {open && role === "seller" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createProduct.mutate({
              name: name.trim(),
              price: Number(price),
              image: image.trim(),
            });
          }}
          className="mt-6 grid gap-3 rounded-xl border bg-card p-6 sm:grid-cols-[1fr_160px_1fr_auto]"
        >
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Product name"
            aria-label="Product name"
            className="rounded-md border bg-background px-3 py-2"
          />
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Price"
            aria-label="Price"
            className="rounded-md border bg-background px-3 py-2"
          />
          <input
            required
            type="url"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="Image URL"
            aria-label="Image URL"
            className="rounded-md border bg-background px-3 py-2"
          />
          <button
            type="submit"
            disabled={createProduct.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {createProduct.isPending ? "Saving…" : "Save product"}
          </button>
        </form>
      )}

      {hydrated && (productsQuery.error || createProduct.error || deleteProduct.error) && (
        <p role="alert" className="mt-6 rounded-lg border border-negative/40 bg-negative/5 p-4 text-negative">
          {(productsQuery.error ?? createProduct.error ?? deleteProduct.error)?.message}
        </p>
      )}
      {!hydrated || productsQuery.isLoading ? (
        <p className="mt-10 text-muted-foreground">Loading products…</p>
      ) : products.length === 0 && !productsQuery.error ? (
        <p className="mt-10 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No products yet.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {products.map((product) => {
            const summary = summarize(product);
            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Link
                  to="/products/$id"
                  params={{ id: product.id }}
                  className="group block"
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="h-48 w-full border-b bg-muted/30 object-contain p-3"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                          {product.category || "Product"}
                        </p>
                        <h2 className="mt-1 font-display text-xl font-semibold group-hover:underline">
                          {product.name}
                        </h2>
                        {typeof product.price === "number" && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Intl.NumberFormat(undefined, {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 2,
                            }).format(product.price)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          User rating
                        </p>
                        <div className="font-display text-2xl font-semibold">
                          {summary.n ? summary.userRating.toFixed(1) : "—"}
                          <span className="ml-1 font-mono text-xs text-muted-foreground">/ 5</span>
                        </div>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          Sentiment rating
                        </p>
                        <div className="font-display text-xl font-semibold">
                          {summary.classified ? summary.sentimentRating.toFixed(1) : "—"}
                          <span className="ml-1 font-mono text-xs text-muted-foreground">/ 5</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5">
                      <SentimentBar count={summary.count} n={summary.classified} />
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted-foreground">
                      <span>
                        <span className="text-positive">{summary.count.positive}</span> ·{" "}
                        <span className="text-neutral-s">{summary.count.neutral}</span> ·{" "}
                        <span className="text-negative">{summary.count.negative}</span> of{" "}
                        {summary.n} ({summary.classified} classified)
                      </span>
                      <SentimentBadge s={summary.overall} />
                    </div>
                  </div>
                </Link>
                {role === "seller" && (
                  <div className="flex justify-end border-t px-6 py-3">
                    <button
                      type="button"
                      disabled={deleteProduct.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete "${product.name}" and all its reviews?`)) {
                          deleteProduct.mutate(product.id);
                        }
                      }}
                      className="rounded-md border border-negative/40 px-3 py-1.5 text-sm font-medium text-negative hover:bg-negative/10 disabled:opacity-60"
                    >
                      {deleteProduct.isPending && deleteProduct.variables === product.id
                        ? "Deleting…"
                        : "Delete product"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
