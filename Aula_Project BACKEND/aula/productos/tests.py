import json

from django.contrib.auth.models import User
from django.test import TestCase

from .models import Product


class ProductApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="test@example.com",
            email="test@example.com",
            password="Password123",
        )
        self.client.force_login(self.user)
        self.product = Product.objects.create(
            owner=self.user,
            name="Producto de prueba",
            sku="TEST-001",
            category="Accesorios",
            cost=10,
            price=20,
            stock=5,
            minimum_stock=1,
        )

    def test_products_are_scoped_to_authenticated_user(self):
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["products"][0]["sku"], "TEST-001")

    def test_duplicate_sku_is_rejected(self):
        response = self.client.post(
            "/api/products/create/",
            data=json.dumps({"name": "Otro", "sku": "test-001", "cat": "Audio", "cost": 1, "price": 2, "stock": 1, "min": 1}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 409)

    def test_sale_updates_stock_atomically(self):
        response = self.client.post(
            "/api/sales/create/",
            data=json.dumps({"customer": "Cliente", "items": [{"id": self.product.id, "quantity": 2}]}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)
