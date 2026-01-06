# backend/apps/accounts/models.py
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with an email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_organizer', False)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True, db_index=True)
    
    # Phone - SIMPLIFIED: Remove regex validator temporarily
    phone = models.CharField(
        _('phone number'),
        max_length=13, 
        blank=True, 
        null=True, 
        unique=True, 
        db_index=True
    )
    
    # Personal info
    first_name = models.CharField(_('first name'), max_length=100)
    last_name = models.CharField(_('last name'), max_length=100)
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    
    # Profile
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(_('bio'), blank=True)
    
    # Location
    country = models.CharField(_('country'), max_length=2, default='KE')
    city = models.CharField(_('city'), max_length=100, blank=True)
    county = models.CharField(_('county'), max_length=100, blank=True)
    
    # Kenyan fields
    id_number = models.CharField(
        _('ID number'), 
        max_length=20, 
        blank=True, 
        null=True,
        help_text='Kenyan National ID number'
    )
    mpesa_number = models.CharField(
        _('M-Pesa number'), 
        max_length=13, 
        blank=True, 
        null=True,
        help_text='M-Pesa number for payments and payouts'
    )
    
    # User roles
    is_organizer = models.BooleanField(_('organizer status'), default=False)
    is_verified = models.BooleanField(_('verified status'), default=False)
    is_active = models.BooleanField(_('active'), default=True)
    is_staff = models.BooleanField(_('staff status'), default=False)
    
    # Settings - FIXED: Change from 'timezone' to 'timezone_field' to avoid conflict
    language = models.CharField(_('language'), max_length=10, default='en')
    currency = models.CharField(_('currency'), max_length=3, default='KES')
    timezone_field = models.CharField(_('timezone'), max_length=50, default='Africa/Nairobi')  # CHANGED
    
    # Timestamps
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    last_login = models.DateTimeField(_('last login'), null=True, blank=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    # Login tracking
    login_count = models.IntegerField(_('login count'), default=0)
    
    # FIX: Add custom related_name for groups and user_permissions
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='deevents_user_set',
        related_query_name='deevents_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='deevents_user_set',
        related_query_name='deevents_user',
    )
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'deevents_users'
        verbose_name = _('user')
        verbose_name_plural = _('users')
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['country', 'is_organizer']),
            models.Index(fields=['is_verified', 'is_active']),
        ]
        ordering = ['-date_joined']
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        return self.first_name
    
    # Django admin requires these methods
    def has_perm(self, perm, obj=None):
        """Does the user have a specific permission?"""
        return self.is_superuser
    
    def has_module_perms(self, app_label):
        """Does the user have permissions to view the app `app_label`?"""
        return self.is_superuser
    
class KYCVerification(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    DOCUMENT_TYPES = [
        ('national_id', 'National ID Card'),
        ('passport', 'Passport'),
        ('alien_id', 'Alien ID'),
        ('driver_license', "Driver's License"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='kyc_verification'
    )
    
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default='national_id')
    document_number = models.CharField(max_length=100)
    document_front = models.ImageField(upload_to='kyc/documents/')
    document_back = models.ImageField(upload_to='kyc/documents/', null=True, blank=True)
    selfie_with_document = models.ImageField(upload_to='kyc/selfies/')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    verified_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='verified_kycs'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'deevents_kyc_verifications'
        verbose_name = 'KYC verification'
        verbose_name_plural = 'KYC verifications'
    
    def __str__(self):
        return f"KYC for {self.user.email}"