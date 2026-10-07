import type { Product, Review } from "./data";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

type CreateProductInput = {
  name: string;
  price: number;
  image: string;
};

type CreateReviewResponse = {
  success: true;
  message: string;
  review: Review;
  new_product_rating: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      `Could not reach the backend at ${API_BASE_URL}. Check that the FastAPI server is running.`,
    );
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    const detail =
      typeof body === "object" && body !== null && "detail" in body
        ? String(body.detail)
        : `Backend request failed (${response.status}).`;
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getProducts: () => request<Product[]>("/products"),
  getProduct: (productId: string) =>
    request<Product>(`/products/${encodeURIComponent(productId)}`),
  createProduct: (product: CreateProductInput) =>
    request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),
  deleteProduct: (productId: string) =>
    request<{ success: true; message: string }>(`/products/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    }),
  createReview: (productId: string, review: { text: string; rating: number }) =>
    request<CreateReviewResponse>(`/products/${encodeURIComponent(productId)}/reviews`, {
      method: "POST",
      body: JSON.stringify(review),
    }),
};
