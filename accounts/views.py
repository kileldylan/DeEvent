# backend/apps/accounts/views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db.models import F

from .models import User, KYCVerification
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    KYCSerializer,
)

class RegisterView(generics.CreateAPIView):
    """Register a new user - SIMPLIFIED WORKING VERSION"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return Response({
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'country': user.country,
                },
                'refresh': str(refresh),
                'access': str(access_token),
                'message': 'User registered successfully!'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'detail': 'Registration failed. Please check your data.'
            }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """User login view - SIMPLIFIED"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = UserLoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Update login tracking
            user.last_login = timezone.now()
            user.login_count = F('login_count') + 1
            user.save(update_fields=['last_login'])
            user.refresh_from_db()
            
            return Response({
                'user': UserProfileSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Login successful!'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'detail': 'Login failed.'
            }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """User logout view"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Logout successful!"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update user profile"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """Change user password"""
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Check old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {"old_password": "Wrong password."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({"message": "Password updated successfully!"})
class KYCSubmitView(generics.CreateAPIView):
    """Submit KYC documents"""
    serializer_class = KYCSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data['message'] = 'KYC submitted successfully! It will be reviewed within 24-48 hours.'
        return response


class KYCStatusView(generics.RetrieveAPIView):
    """Get KYC status"""
    serializer_class = KYCSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        try:
            return self.request.user.kyc_verification
        except KYCVerification.DoesNotExist:
            return None
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance is None:
            return Response(
                {"detail": "No KYC submission found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class VerifyEmailView(APIView):
    """Verify user email (simplified for now)"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        token = request.data.get('token')
        
        if not email or not token:
            return Response(
                {"error": "Email and token are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            # In production, validate token against database
            # For now, just mark as verified
            user.is_verified = True
            user.save()
            
            return Response({
                "message": "Email verified successfully!",
                "verified": True
            })
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class RequestPasswordResetView(APIView):
    """Request password reset"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            # In production: Generate reset token, send email
            # For MVP, we'll implement this later
            return Response({
                "message": "Password reset instructions sent to your email.",
                "email": email
            })
        except User.DoesNotExist:
            # Don't reveal if email exists (security best practice)
            return Response({
                "message": "If an account exists with this email, reset instructions have been sent."
            })


class AdminKYCListView(generics.ListAPIView):
    """Admin view to list KYC submissions (for staff only)"""
    serializer_class = KYCSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        status_filter = self.request.query_params.get('status', None)
        queryset = KYCVerification.objects.all()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-submitted_at')


class AdminKYCReviewView(APIView):
    """Admin view to approve/reject KYC"""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, kyc_id):
        action = request.data.get('action')  # 'approve' or 'reject'
        reason = request.data.get('reason', '')
        
        if action not in ['approve', 'reject']:
            return Response(
                {"error": "Action must be 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            kyc = KYCVerification.objects.get(id=kyc_id)
        except KYCVerification.DoesNotExist:
            return Response(
                {"error": "KYC submission not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if action == 'approve':
            kyc.approve(request.user)
            message = "KYC approved successfully."
        else:
            if not reason:
                return Response(
                    {"error": "Reason is required for rejection."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            kyc.reject(reason, request.user)
            message = "KYC rejected."
        
        return Response({
            "message": message,
            "kyc": KYCSerializer(kyc).data
        })