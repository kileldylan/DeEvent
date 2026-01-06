# backend/apps/accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # Email verification
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify_email'),
    
    # Password reset
    path('request-reset/', views.RequestPasswordResetView.as_view(), name='request_password_reset'),
    
    # KYC
    path('kyc/submit/', views.KYCSubmitView.as_view(), name='kyc_submit'),
    path('kyc/status/', views.KYCStatusView.as_view(), name='kyc_status'),
    
    # Admin KYC management
    path('admin/kyc/', views.AdminKYCListView.as_view(), name='admin_kyc_list'),
    path('admin/kyc/<uuid:kyc_id>/review/', views.AdminKYCReviewView.as_view(), name='admin_kyc_review'),
]