from backend.firebase_db import db


# --------------------------------------------------
# Create product
# --------------------------------------------------

def create_product(name, price, image, reviews=None, rating=0):

    product = {
        "name": name,
        "price": price,
        "image": image,
        "rating": rating,
        "reviews": reviews or [],
    }

    doc_ref = db.collection("products").add(product)

    return {
        "id": doc_ref[1].id,
        **product,
    }