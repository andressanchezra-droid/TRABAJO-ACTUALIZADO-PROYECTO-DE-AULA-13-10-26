from django.contrib import admin

from .models import CompanyProfile, Product, Sale, SaleItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "category", "stock", "price", "active", "owner")
    list_filter = ("active", "category")
    search_fields = ("name", "sku")


admin.site.register(CompanyProfile)
admin.site.register(Sale)
admin.site.register(SaleItem)
