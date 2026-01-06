from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'organizations', views.OrganizationViewSet, basename='organization')
router.register(r'admin/organizations', views.AdminOrganizationViewSet, basename='admin-organization')

# Nested routes for organization members
organizations_router = DefaultRouter()
organizations_router.register(r'members', views.OrganizationMemberViewSet, basename='organization-member')

urlpatterns = [
    path('', include(router.urls)),
    path('organizations/<uuid:organization_pk>/', include(organizations_router.urls)),
    
    # Additional custom endpoints
    path('organizations/my-organizations/', 
         views.OrganizationViewSet.as_view({'get': 'my_organizations'}), 
         name='my-organizations'),
]