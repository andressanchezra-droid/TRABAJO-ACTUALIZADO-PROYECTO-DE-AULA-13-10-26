from django.urls import path

from . import views

urlpatterns = [
    path("api/auth/csrf/", views.csrf_api, name="api_csrf"),
    path("api/auth/login/", views.login_api, name="api_login"),
    path("api/auth/register/", views.register_api, name="api_register"),
    path("api/auth/session/", views.session_api, name="api_session"),
    path("api/auth/logout/", views.logout_api, name="api_logout"),
    path("api/products/", views.products_api, name="api_products"),
    path("api/products/create/", views.product_create_api, name="api_product_create"),
    path("api/products/<int:product_id>/", views.product_update_api, name="api_product_update"),
    path("api/products/<int:product_id>/delete/", views.product_delete_api, name="api_product_delete"),
    path("api/sales/", views.sales_api, name="api_sales"),
    path("api/sales/create/", views.sale_create_api, name="api_sale_create"),
    path("api/team/", views.team_api, name="api_team"),
    path("api/team/create/", views.team_create_api, name="api_team_create"),
]
