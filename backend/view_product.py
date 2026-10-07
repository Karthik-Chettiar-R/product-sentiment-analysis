from backend.firebase_db import db


def view_product(product_id):
    product_doc = db.collection("products").document(product_id).get()
    if not product_doc.exists:
        return None

    return {
        "id": product_doc.id,
        **(product_doc.to_dict() or {}),
    }


def list_products():
    return [
        {
            "id": product_doc.id,
            **(product_doc.to_dict() or {}),
        }
        for product_doc in db.collection("products").stream()
    ]


def delete_product(product_id):
    product_ref = db.collection("products").document(product_id)
    if not product_ref.get().exists:
        return False

    product_ref.delete()
    return True
