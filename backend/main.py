import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl

from backend.create_product import create_product
from backend.create_review import create_review, initialize_models
from backend.view_product import delete_product, list_products, view_product


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_models()
    yield


app = FastAPI(
    title="Product Reviews API",
    description="Product management and Hindi/English aspect-based review analysis.",
    lifespan=lifespan,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:8080,http://127.0.0.1:8080",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["DELETE", "GET", "POST"],
    allow_headers=["Content-Type"],
)


class ProductCreate(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(ge=0)
    image: HttpUrl


class ReviewCreate(BaseModel):
    text: str = Field(min_length=1)
    rating: float = Field(ge=1, le=5)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/products", status_code=201)
def add_product(product: ProductCreate):
    if not product.name.strip():
        raise HTTPException(status_code=422, detail="Product name cannot be empty.")

    return create_product(
        name=product.name.strip(),
        price=product.price,
        image=str(product.image),
    )


@app.get("/products")
def get_products():
    return list_products()


@app.get("/products/{product_id}")
def get_product(product_id: str):
    product = view_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


@app.delete("/products/{product_id}")
def remove_product(product_id: str):
    if not delete_product(product_id):
        raise HTTPException(status_code=404, detail="Product not found.")
    return {"success": True, "message": "Product deleted successfully."}


@app.post("/products/{product_id}/reviews", status_code=201)
def add_review(product_id: str, review: ReviewCreate) -> dict[str, Any]:
    if not review.text.strip():
        raise HTTPException(status_code=422, detail="Review cannot be empty.")

    result = create_review(
        product_id=product_id,
        review_text=review.text.strip(),
        rating=review.rating,
    )
    if not result["success"]:
        error = result["error"]
        status_code = 404 if "does not exist" in error else 422
        raise HTTPException(status_code=status_code, detail=error)

    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000)
