import json
import re
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import CompanyProfile, Product, Sale, SaleItem, TeamMember


def response(data, status=200):
    return JsonResponse(data, status=status)


def body(request):
    try:
        value = json.loads(request.body or "{}")
    except json.JSONDecodeError as error:
        raise ValueError("El cuerpo de la solicitud debe ser JSON válido.") from error
    if not isinstance(value, dict):
        raise ValueError("El cuerpo de la solicitud debe ser un objeto JSON.")
    return value


def user_data(user):
    profile, _ = CompanyProfile.objects.get_or_create(user=user, defaults={"company": "Nova Comercial"})
    return {
        "name": user.get_full_name() or user.username,
        "email": user.email,
        "company": profile.company,
        "role": "Administrador",
    }


def error_response(error, status=400):
    return response({"error": str(error)}, status)


@ensure_csrf_cookie
@require_http_methods(["GET"])
def csrf_api(request):
    return response({"csrfToken": get_token(request)})


@require_http_methods(["GET"])
def session_api(request):
    if not request.user.is_authenticated:
        return error_response("Debes iniciar sesión.", 401)
    return response({"user": user_data(request.user)})


@require_http_methods(["POST"])
def login_api(request):
    try:
        data = body(request)
        email = str(data.get("email", "")).strip().lower()
        password = data.get("password", "")
        user = User.objects.filter(email__iexact=email).first()
        authenticated = authenticate(request, username=user.username, password=password) if user else None
        if not authenticated:
            return error_response("Correo o contraseña incorrectos.", 401)
        login(request, authenticated)
        return response({"user": user_data(authenticated)})
    except ValueError as error:
        return error_response(error)


@require_http_methods(["POST"])
def register_api(request):
    try:
        data = body(request)
        name = str(data.get("name", "")).strip()
        company = str(data.get("company", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        password = data.get("password", "")
        if not name or not company or not email or not password:
            raise ValueError("Todos los campos obligatorios deben completarse.")
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            raise ValueError("Escribe un correo electrónico válido.")
        if len(password) < 8 or not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
            raise ValueError("La contraseña debe tener mínimo 8 caracteres, una letra y un número.")
        if User.objects.filter(email__iexact=email).exists():
            return error_response("Ya existe una cuenta con ese correo.", 409)
        with transaction.atomic():
            user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
            CompanyProfile.objects.create(user=user, company=company)
        login(request, user)
        return response({"user": user_data(user)}, 201)
    except ValueError as error:
        return error_response(error)
    except IntegrityError:
        return error_response("No fue posible crear la cuenta.", 409)


@require_http_methods(["POST"])
def logout_api(request):
    logout(request)
    return response({"message": "Sesión cerrada."})


@login_required
@require_http_methods(["GET"])
def products_api(request):
    return response({"products": [product.as_dict() for product in Product.objects.filter(owner=request.user)]})


def product_values(data):
    name = str(data.get("name", "")).strip()
    sku = str(data.get("sku", "")).strip().upper()
    category = str(data.get("cat", "")).strip()
    if not name or not sku or not category:
        raise ValueError("Nombre, SKU y categoría son obligatorios.")
    values = {
        "cost": Decimal(str(data.get("cost", ""))),
        "price": Decimal(str(data.get("price", ""))),
        "stock": int(data.get("stock")),
        "minimum_stock": int(data.get("min")),
    }
    if any(value < 0 for value in values.values()):
        raise ValueError("Los precios y el stock no pueden ser negativos.")
    return {
        "name": name,
        "sku": sku,
        "category": category,
        "description": str(data.get("desc", "")).strip(),
        "active": bool(data.get("active", True)),
        "image": data.get("image"),
        "icon": str(data.get("icon", "box")),
        **values,
    }


@login_required
@require_http_methods(["POST"])
def product_create_api(request):
    try:
        product = Product.objects.create(owner=request.user, **product_values(body(request)))
    except (ValueError, InvalidOperation, TypeError):
        return error_response("Los datos del producto no son válidos.")
    except IntegrityError:
        return error_response("Ya existe un producto con ese SKU.", 409)
    return response({"product": product.as_dict()}, 201)


@login_required
@require_http_methods(["PUT", "PATCH"])
def product_update_api(request, product_id):
    product = Product.objects.filter(id=product_id, owner=request.user).first()
    if not product:
        return error_response("Producto no encontrado.", 404)
    try:
        data = product_values(body(request))
        for field, value in data.items():
            setattr(product, field, value)
        product.save()
    except (ValueError, InvalidOperation, TypeError):
        return error_response("Los datos del producto no son válidos.")
    except IntegrityError:
        return error_response("Ya existe un producto con ese SKU.", 409)
    return response({"product": product.as_dict()})


@login_required
@require_http_methods(["DELETE"])
def product_delete_api(request, product_id):
    product = Product.objects.filter(id=product_id, owner=request.user).first()
    if not product:
        return error_response("Producto no encontrado.", 404)
    product.delete()
    return response({"message": "Producto eliminado."})


@login_required
@require_http_methods(["GET"])
def sales_api(request):
    return response({"sales": [sale.as_dict() for sale in Sale.objects.filter(owner=request.user)][:50]})


@login_required
@require_http_methods(["POST"])
def sale_create_api(request):
    try:
        data = body(request)
        items = data.get("items", [])
        if not items:
            raise ValueError("La venta debe incluir al menos un producto.")
        with transaction.atomic():
            products = []
            subtotal = Decimal("0")
            for item in items:
                product = Product.objects.select_for_update().get(id=int(item["id"]), owner=request.user, active=True)
                quantity = int(item["quantity"])
                if quantity < 1 or quantity > product.stock:
                    raise ValueError(f"Stock insuficiente para {product.name}.")
                products.append((product, quantity))
                subtotal += product.price * quantity
            folio = f"V-{Sale.objects.filter(owner=request.user).count() + 1046}"
            tax = (subtotal * Decimal("0.16")).quantize(Decimal("0.01"))
            sale = Sale.objects.create(
                owner=request.user,
                folio=folio,
                customer=str(data.get("customer", "Público general")).strip()[:120] or "Público general",
                subtotal=subtotal,
                tax=tax,
                total=subtotal + tax,
            )
            for product, quantity in products:
                SaleItem.objects.create(sale=sale, product=product, quantity=quantity, unit_price=product.price)
                product.stock -= quantity
                product.save(update_fields=["stock", "updated_at"])
    except (Product.DoesNotExist, KeyError, TypeError, ValueError, InvalidOperation):
        return error_response("La venta no es válida o no hay stock suficiente.")
    return response({"sale": sale.as_dict()}, 201)


@login_required
@require_http_methods(["GET"])
def team_api(request):
    members = [TeamMember(**{})] if False else []
    return response({"team": [member.as_dict() for member in TeamMember.objects.filter(owner=request.user)]})


@login_required
@require_http_methods(["POST"])
def team_create_api(request):
    try:
        data = body(request)
        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        role = str(data.get("role", "Vendedor")).strip()
        if not name or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            raise ValueError("Escribe un nombre y un correo válidos.")
        member = TeamMember.objects.create(owner=request.user, name=name, email=email, role=role)
    except ValueError as error:
        return error_response(error)
    except IntegrityError:
        return error_response("Ese correo ya está en el equipo.", 409)
    return response({"member": member.as_dict()}, 201)

