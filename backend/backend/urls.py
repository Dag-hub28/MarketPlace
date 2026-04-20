from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from jobs.views import (
    RegisterView,
    UserViewSet,
    ProductViewSet,
    ApplicationViewSet,
    CategoryViewSet,
    MessageViewSet,
    ReviewViewSet,
    CartViewSet,
    OrderViewSet,
)

router = routers.DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("products", ProductViewSet, basename="product")
router.register("applications", ApplicationViewSet, basename="application")
router.register("categories", CategoryViewSet, basename="category")
router.register("messages", MessageViewSet, basename="message")
router.register("reviews", ReviewViewSet, basename="review")
router.register("cart", CartViewSet, basename="cart")
router.register("orders", OrderViewSet, basename="order")

import os

frontend_dist = os.path.join(settings.BASE_DIR, "..", "frontend", "dist")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include(router.urls)),
    re_path(
        r"^assets/(?P<path>.*)$",
        serve,
        {"document_root": os.path.join(frontend_dist, "assets")},
    ),
    re_path(
        r"^(?P<path>.*)$", serve, {"document_root": frontend_dist, "fallback": True}
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
