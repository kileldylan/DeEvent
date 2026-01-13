# backend/apps/accounts/tests.py
from datetime import timezone
import os
import tempfile
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient, APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, KYCVerification
from .views import (
    RegisterView, LoginView, LogoutView, RequestPasswordResetView, UserProfileView, 
    ChangePasswordView, KYCSubmitView, KYCStatusView,
    AdminKYCListView, AdminKYCReviewView, VerifyEmailView
)

# Get custom user model
User = get_user_model()


class BaseTestCase(APITestCase):
    """Base test class with common setup"""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='TestPass123!',
            first_name='Test',
            last_name='User',
            country='KE',
            phone='+254712345678'
        )
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='AdminPass123!',
            first_name='Admin',
            last_name='User',
            country='KE',
            is_staff=True,
            is_superuser=True
        )
        
        # Create KYC for test user
        self.kyc = KYCVerification.objects.create(
            user=self.user,
            document_type='national_id',
            document_number='12345678'
        )
        
        # Setup API client
        self.client = APIClient()
        
        # Generate tokens for test user
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = str(self.refresh.access_token)
        
        # Generate tokens for admin user
        admin_refresh = RefreshToken.for_user(self.admin_user)
        self.admin_access_token = str(admin_refresh.access_token)


class UserRegistrationTests(BaseTestCase):
    """Test user registration"""
    
    def test_successful_registration(self):
        """Test successful user registration"""
        url = reverse('register')
        data = {
            'email': 'newuser@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'NewPass123!',
            'password2': 'NewPass123!',
            'country': 'KE',
            'phone': '+254712345699'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'newuser@example.com')
        self.assertEqual(response.data['user']['first_name'], 'New')
        self.assertEqual(response.data['user']['last_name'], 'User')
        
        # Verify user was created in database
        user = User.objects.get(email='newuser@example.com')
        self.assertEqual(user.first_name, 'New')
        self.assertEqual(user.last_name, 'User')
        self.assertEqual(user.country, 'KE')
        self.assertEqual(user.phone, '+254712345679')
        self.assertFalse(user.is_verified)
        self.assertFalse(user.is_organizer)
        self.assertTrue(user.is_active)
    
    def test_registration_missing_required_fields(self):
        """Test registration with missing required fields"""
        url = reverse('register')
        data = {
            'email': 'test@example.com',
            # Missing first_name, last_name
            'password': 'Test123!',
            'password2': 'Test123!'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
    
    def test_registration_password_mismatch(self):
        """Test registration with mismatching passwords"""
        url = reverse('register')
        data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'Password123!',
            'password2': 'Different123!',  # Different password
            'country': 'KE'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_registration_duplicate_email(self):
        """Test registration with duplicate email"""
        url = reverse('register')
        data = {
            'email': 'testuser@example.com',  # Already exists
            'first_name': 'Another',
            'last_name': 'User',
            'password': 'Test123!',
            'password2': 'Test123!',
            'country': 'KE'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_registration_invalid_phone(self):
        """Test registration with invalid phone number"""
        url = reverse('register')
        data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'Test123!',
            'password2': 'Test123!',
            'country': 'KE',
            'phone': '123'  # Invalid phone
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', response.data)
    
    def test_registration_phone_format_conversion(self):
        """Test phone number format conversion"""
        url = reverse('register')
        
        # Test 07XXXXXXXX format
        data = {
            'email': 'test07@example.com',
            'first_name': 'Test',
            'last_name': 'Seven',
            'password': 'Test123!',
            'password2': 'Test123!',
            'country': 'KE',
            'phone': '0712345678'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='test07@example.com')
        self.assertEqual(user.phone, '+254712345678')
        
        # Test +254 format
        data['email'] = 'test254@example.com'
        data['phone'] = '+254712345679'
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='test254@example.com')
        self.assertEqual(user.phone, '+254712345679')


class UserLoginTests(BaseTestCase):
    """Test user login"""
    
    def test_successful_login_with_email(self):
        """Test successful login with email"""
        url = reverse('login')
        data = {
            'email': 'testuser@example.com',
            'password': 'TestPass123!'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'testuser@example.com')
        self.assertEqual(response.data['message'], 'Login successful!')
        
        # Verify login count was incremented
        user = User.objects.get(email='testuser@example.com')
        self.assertGreater(user.login_count, 0)
    
    def test_successful_login_with_phone(self):
        """Test successful login with phone number"""
        url = reverse('login')
        data = {
            'phone': '0712345678',  # 07 format
            'password': 'TestPass123!'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        
        # Test with +254 format
        data['phone'] = '+254712345678'
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        url = reverse('login')
        
        # Wrong password
        data = {
            'email': 'testuser@example.com',
            'password': 'WrongPassword123!'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        
        # Non-existent email
        data = {
            'email': 'nonexistent@example.com',
            'password': 'TestPass123!'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_login_missing_credentials(self):
        """Test login with missing credentials"""
        url = reverse('login')
        
        # Missing both email and phone
        data = {
            'password': 'TestPass123!'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
    
    def test_login_inactive_user(self):
        """Test login with inactive user account"""
        # Create inactive user
        inactive_user = User.objects.create_user(
            email='inactive@example.com',
            password='TestPass123!',
            first_name='Inactive',
            last_name='User',
            is_active=False
        )
        
        url = reverse('login')
        data = {
            'email': 'inactive@example.com',
            'password': 'TestPass123!'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('account', response.data)


class UserProfileTests(BaseTestCase):
    """Test user profile operations"""
    
    def test_get_profile_authenticated(self):
        """Test getting profile when authenticated"""
        url = reverse('profile')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'testuser@example.com')
        self.assertEqual(response.data['first_name'], 'Test')
        self.assertEqual(response.data['last_name'], 'User')
        self.assertEqual(response.data['country'], 'KE')
        self.assertIn('kyc_status', response.data)
    
    def test_get_profile_unauthenticated(self):
        """Test getting profile without authentication"""
        url = reverse('profile')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_profile(self):
        """Test updating user profile"""
        url = reverse('profile')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'city': 'Nairobi',
            'county': 'Nairobi',
            'bio': 'This is my updated bio'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['last_name'], 'Name')
        self.assertEqual(response.data['city'], 'Nairobi')
        
        # Verify database update
        user = User.objects.get(email='testuser@example.com')
        self.assertEqual(user.first_name, 'Updated')
        self.assertEqual(user.city, 'Nairobi')
    
    def test_update_profile_phone_format(self):
        """Test phone number formatting on profile update"""
        url = reverse('profile')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        # Test updating phone with 07 format
        data = {'phone': '0798765432'}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify phone was converted
        user = User.objects.get(email='testuser@example.com')
        self.assertEqual(user.phone, '+254798765432')
    
    def test_cannot_update_readonly_fields(self):
        """Test that readonly fields cannot be updated"""
        url = reverse('profile')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        original_date = self.user.date_joined
        
        data = {
            'email': 'newemail@example.com',  # Readonly
            'is_verified': True,  # Readonly
            'date_joined': '2024-01-01T00:00:00Z'  # Readonly
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify readonly fields were not changed
        user = User.objects.get(id=self.user.id)
        self.assertEqual(user.email, 'testuser@example.com')  # Should not change
        self.assertFalse(user.is_verified)  # Should not change
        self.assertEqual(user.date_joined, original_date)  # Should not change


class ChangePasswordTests(BaseTestCase):
    """Test password change functionality"""
    
    def test_successful_password_change(self):
        """Test successful password change"""
        url = reverse('change_password')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {
            'old_password': 'TestPass123!',
            'new_password': 'NewPass456!',
            'confirm_password': 'NewPass456!'
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Password updated successfully!')
        
        # Verify new password works
        user = User.objects.get(email='testuser@example.com')
        self.assertTrue(user.check_password('NewPass456!'))
        
        # Verify old password doesn't work
        self.assertFalse(user.check_password('TestPass123!'))
    
    def test_password_change_wrong_old_password(self):
        """Test password change with wrong old password"""
        url = reverse('change_password')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {
            'old_password': 'WrongOldPass!',
            'new_password': 'NewPass456!',
            'confirm_password': 'NewPass456!'
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('old_password', response.data)
    
    def test_password_change_mismatched_new_passwords(self):
        """Test password change with mismatched new passwords"""
        url = reverse('change_password')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {
            'old_password': 'TestPass123!',
            'new_password': 'NewPass456!',
            'confirm_password': 'DifferentPass789!'  # Different
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', response.data)
    
    def test_password_change_weak_password(self):
        """Test password change with weak password"""
        url = reverse('change_password')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {
            'old_password': 'TestPass123!',
            'new_password': 'weak',  # Too weak
            'confirm_password': 'weak'
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)
    
    def test_password_change_unauthenticated(self):
        """Test password change without authentication"""
        url = reverse('change_password')
        
        data = {
            'old_password': 'TestPass123!',
            'new_password': 'NewPass456!',
            'confirm_password': 'NewPass456!'
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class KYCTests(BaseTestCase):
    """Test KYC functionality"""
    
    def create_test_image(self, name='test.jpg'):
        """Helper to create test image file"""
        return SimpleUploadedFile(
            name=name,
            content=b'simple image content',
            content_type='image/jpeg'
        )
    
    def test_kyc_submission(self):
        """Test KYC document submission"""
        # Delete existing KYC
        self.kyc.delete()
        
        url = reverse('kyc_submit')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {
            'document_type': 'national_id',
            'document_number': '12345678',
            'document_front': self.create_test_image('front.jpg'),
            'selfie_with_document': self.create_test_image('selfie.jpg')
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'KYC submitted successfully! It will be reviewed within 24-48 hours.')
        
        # Verify KYC was created
        kyc = KYCVerification.objects.get(user=self.user)
        self.assertEqual(kyc.document_type, 'national_id')
        self.assertEqual(kyc.document_number, '12345678')
        self.assertEqual(kyc.status, 'pending')
    
    def test_kyc_submission_duplicate(self):
        """Test KYC submission when already has pending KYC"""
        url = reverse('kyc_submit')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {
            'document_type': 'national_id',
            'document_number': '87654321',
            'document_front': self.create_test_image('front.jpg'),
            'selfie_with_document': self.create_test_image('selfie.jpg')
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_kyc_status_exists(self):
        """Test getting KYC status when KYC exists"""
        url = reverse('kyc_status')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['document_type'], 'national_id')
        self.assertEqual(response.data['document_number'], '12345678')
        self.assertEqual(response.data['status'], 'pending')
    
    def test_get_kyc_status_not_exists(self):
        """Test getting KYC status when no KYC exists"""
        # Delete KYC
        self.kyc.delete()
        
        url = reverse('kyc_status')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'No KYC submission found.')
    
    def test_kyc_invalid_document_number(self):
        """Test KYC submission with invalid document number"""
        # Delete existing KYC
        self.kyc.delete()
        
        url = reverse('kyc_submit')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {
            'document_type': 'national_id',
            'document_number': '123',  # Invalid (should be 8 digits)
            'document_front': self.create_test_image('front.jpg'),
            'selfie_with_document': self.create_test_image('selfie.jpg')
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('document_number', response.data)


class AdminKYCTests(BaseTestCase):
    """Test admin KYC management"""
    
    def test_admin_kyc_list_authenticated_admin(self):
        """Test admin KYC list view as authenticated admin"""
        url = reverse('admin_kyc_list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_access_token}')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Should have 1 KYC
        
        # Test filtering by status
        response = self.client.get(f"{url}?status=pending")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_admin_kyc_list_unauthenticated(self):
        """Test admin KYC list view without authentication"""
        url = reverse('admin_kyc_list')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_admin_kyc_list_non_admin(self):
        """Test admin KYC list view as non-admin user"""
        url = reverse('admin_kyc_list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_kyc_approve(self):
        """Test admin KYC approval"""
        url = reverse('admin_kyc_review', args=[str(self.kyc.id)])
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_access_token}')
        
        data = {
            'action': 'approve'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'KYC approved successfully.')
        
        # Verify KYC was approved
        self.kyc.refresh_from_db()
        self.assertEqual(self.kyc.status, 'verified')
        self.assertEqual(self.kyc.verified_by, self.admin_user)
        self.assertIsNotNone(self.kyc.verified_at)
        self.assertIsNotNone(self.kyc.expires_at)
        
        # Verify user was marked as verified
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_verified)
    
    def test_admin_kyc_reject(self):
        """Test admin KYC rejection"""
        url = reverse('admin_kyc_review', args=[str(self.kyc.id)])
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_access_token}')
        
        data = {
            'action': 'reject',
            'reason': 'Document image is blurry'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'KYC rejected.')
        
        # Verify KYC was rejected
        self.kyc.refresh_from_db()
        self.assertEqual(self.kyc.status, 'rejected')
        self.assertEqual(self.kyc.rejection_reason, 'Document image is blurry')
    
    def test_admin_kyc_reject_missing_reason(self):
        """Test admin KYC rejection without reason"""
        url = reverse('admin_kyc_review', args=[str(self.kyc.id)])
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_access_token}')
        
        data = {
            'action': 'reject'
            # Missing reason
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_admin_kyc_invalid_action(self):
        """Test admin KYC with invalid action"""
        url = reverse('admin_kyc_review', args=[str(self.kyc.id)])
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_access_token}')
        
        data = {
            'action': 'invalid_action'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_admin_kyc_nonexistent(self):
        """Test admin KYC review for non-existent KYC"""
        url = reverse('admin_kyc_review', args=['00000000-0000-0000-0000-000000000000'])
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_access_token}')
        
        data = {
            'action': 'approve'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)


class LogoutTests(BaseTestCase):
    """Test logout functionality"""
    
    def test_successful_logout(self):
        """Test successful logout"""
        url = reverse('logout')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {
            'refresh': str(self.refresh)
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Logout successful!')
    
    def test_logout_without_refresh_token(self):
        """Test logout without refresh token"""
        url = reverse('logout')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {}  # No refresh token
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_logout_unauthenticated(self):
        """Test logout without authentication"""
        url = reverse('logout')
        
        data = {
            'refresh': 'some_refresh_token'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class EmailVerificationTests(BaseTestCase):
    """Test email verification"""
    
    def setUp(self):
        super().setUp()
        self.factory = APIRequestFactory()
        self.view = VerifyEmailView.as_view()
    
    def test_email_verification_missing_fields(self):
        """Test email verification with missing fields"""
        request = self.factory.post('', {})
        response = self.view(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    @patch('apps.accounts.views.User.objects.get')
    def test_email_verification_success(self, mock_get):
        """Test successful email verification"""
        mock_get.return_value = self.user
        
        data = {
            'email': 'testuser@example.com',
            'token': 'verification_token'
        }
        
        request = self.factory.post('', data, format='json')
        response = self.view(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Email verified successfully!')
        self.assertTrue(response.data['verified'])
        
        # Verify user was marked as verified
        self.assertTrue(self.user.is_verified)
    
    @patch('apps.accounts.views.User.objects.get')
    def test_email_verification_user_not_found(self, mock_get):
        """Test email verification for non-existent user"""
        mock_get.side_effect = User.DoesNotExist
        
        data = {
            'email': 'nonexistent@example.com',
            'token': 'verification_token'
        }
        
        request = self.factory.post('', data, format='json')
        response = self.view(request)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)


class PasswordResetTests(BaseTestCase):
    """Test password reset functionality"""
    
    def setUp(self):
        super().setUp()
        self.factory = APIRequestFactory()
        self.view = RequestPasswordResetView.as_view()
    
    def test_password_reset_missing_email(self):
        """Test password reset request without email"""
        request = self.factory.post('', {})
        response = self.view(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_password_reset_existing_user(self):
        """Test password reset request for existing user"""
        data = {'email': 'testuser@example.com'}
        
        request = self.factory.post('', data, format='json')
        response = self.view(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Password reset instructions sent to your email.')
        self.assertEqual(response.data['email'], 'testuser@example.com')
    
    def test_password_reset_non_existent_user(self):
        """Test password reset request for non-existent user"""
        data = {'email': 'nonexistent@example.com'}
        
        request = self.factory.post('', data, format='json')
        response = self.view(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('If an account exists', response.data['message'])


class UserModelTests(TestCase):
    """Test User model methods"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='modeluser@example.com',
            password='TestPass123!',
            first_name='Model',
            last_name='User',
            phone='+254712345678'
        )
    
    def test_user_str_representation(self):
        """Test user string representation"""
        self.assertEqual(
            str(self.user),
            'modeluser@example.com (Model User)'
        )
    
    def test_get_full_name(self):
        """Test get_full_name method"""
        self.assertEqual(self.user.get_full_name(), 'Model User')
    
    def test_get_short_name(self):
        """Test get_short_name method"""
        self.assertEqual(self.user.get_short_name(), 'Model')
    
    def test_full_name_property(self):
        """Test full_name property"""
        self.assertEqual(self.user.full_name, 'Model User')
    
    def test_is_attendee_property(self):
        """Test is_attendee property"""
        # Regular user should be attendee
        self.assertTrue(self.user.is_attendee)
        
        # Organizer should not be attendee
        self.user.is_organizer = True
        self.user.save()
        self.assertFalse(self.user.is_attendee)
        
        # Staff should not be attendee
        self.user.is_organizer = False
        self.user.is_staff = True
        self.user.save()
        self.assertFalse(self.user.is_attendee)
    
    def test_format_phone_international(self):
        """Test phone number formatting"""
        # Test with +254 format
        self.user.phone = '+254712345678'
        self.user.save()
        self.assertEqual(self.user.format_phone_international(), '+254712345678')
        
        # Test with 0 format
        self.user.phone = '0712345678'
        self.user.save()
        self.assertEqual(self.user.format_phone_international(), '+254712345678')
        
        # Test with 7 format
        self.user.phone = '712345678'
        self.user.save()
        self.assertEqual(self.user.format_phone_international(), '+254712345678')
        
        # Test with None
        self.user.phone = None
        self.user.save()
        self.assertIsNone(self.user.format_phone_international())


class KYCVerificationModelTests(TestCase):
    """Test KYCVerification model methods"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='kycuser@example.com',
            password='TestPass123!',
            first_name='KYC',
            last_name='User'
        )
        
        self.kyc = KYCVerification.objects.create(
            user=self.user,
            document_type='national_id',
            document_number='12345678'
        )
    
    def test_kyc_str_representation(self):
        """Test KYC string representation"""
        expected = f"KYC for {self.user.email} - Pending Review"
        self.assertEqual(str(self.kyc), expected)
    
    def test_is_valid_method(self):
        """Test is_valid method"""
        # Pending KYC should not be valid
        self.assertFalse(self.kyc.is_valid())
        
        # Approved KYC without expiry should be valid
        self.kyc.status = 'verified'
        self.kyc.save()
        self.assertTrue(self.kyc.is_valid())
        
        # Expired KYC should not be valid
        import datetime
        from django.utils import timezone
        self.kyc.expires_at = timezone.now() - datetime.timedelta(days=1)
        self.kyc.save()
        self.assertFalse(self.kyc.is_valid())
    
    @patch('django.utils.timezone.now')
    def test_approve_method(self, mock_now):
        """Test approve method"""
        from datetime import timedelta
        fixed_time = timezone.now()
        mock_now.return_value = fixed_time
        
        admin_user = User.objects.create_user(
            email='admin@example.com',
            password='AdminPass123!',
            is_staff=True
        )
        
        self.kyc.approve(admin_user)
        
        self.assertEqual(self.kyc.status, 'verified')
        self.assertEqual(self.kyc.verified_by, admin_user)
        self.assertEqual(self.kyc.verified_at, fixed_time)
        self.assertEqual(self.kyc.expires_at, fixed_time + timedelta(days=365))
        
        # Verify user was marked as verified
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_verified)
    
    @patch('django.utils.timezone.now')
    def test_reject_method(self, mock_now):
        """Test reject method"""
        fixed_time = timezone.now()
        mock_now.return_value = fixed_time
        
        admin_user = User.objects.create_user(
            email='admin@example.com',
            password='AdminPass123!',
            is_staff=True
        )
        
        reason = 'Document is blurry'
        self.kyc.reject(reason, admin_user)
        
        self.assertEqual(self.kyc.status, 'rejected')
        self.assertEqual(self.kyc.verified_by, admin_user)
        self.assertEqual(self.kyc.verified_at, fixed_time)
        self.assertEqual(self.kyc.rejection_reason, reason)