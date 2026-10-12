from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class CompanyProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="company_profile")
    company = models.CharField(max_length=120)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.company}"


class TeamMember(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_members")
    name = models.CharField(max_length=120)
    email = models.EmailField()
    role = models.CharField(max_length=40, default="Vendedor")
    status = models.CharField(max_length=30, default="Invitación enviada")
    last_activity = models.CharField(max_length=80, default="Pendiente")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("owner", "email"), name="unique_team_email_per_owner"),
        ]
        ordering = ("name",)

    def as_dict(self):
        return {
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "last": self.last_activity,
        }


class Product(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=120)
    sku = models.CharField(max_length=40)
    category = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    stock = models.PositiveIntegerField()
    minimum_stock = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    image = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=40, default="box")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("owner", "sku"), name="unique_product_sku_per_owner"),
        ]
        ordering = ("name",)

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "sku": self.sku,
            "cat": self.category,
            "desc": self.description,
            "cost": float(self.cost),
            "price": float(self.price),
            "stock": self.stock,
            "min": self.minimum_stock,
            "active": self.active,
            "image": self.image,
            "icon": self.icon,
        }


class Sale(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sales")
    folio = models.CharField(max_length=30)
    customer = models.CharField(max_length=120, default="Público general")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=("owner", "folio"), name="unique_sale_folio_per_owner"),
        ]

    def as_dict(self):
        return {
            "folio": self.folio,
            "cliente": self.customer,
            "total": float(self.total),
            "hora": self.created_at.strftime("%H:%M"),
            "nueva": True,
        }


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sale_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
