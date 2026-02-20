from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminStatsView

# Import admin viewsets from other apps
from organizations.views import AdminOrganizationViewSet
from accounts.admin_views import AdminUserViewSet

router = DefaultRouter()
router.register(r'organizations', AdminOrganizationViewSet, basename='admin-organization')
router.register(r'users', AdminUserViewSet, basename='admin-user')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
]