from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Organization(models.Model):
    """
    Hybrid model: Both personal (auto-created) and business organizations
    """
    
    class OrganizationType(models.TextChoices):
        PERSONAL = 'personal', 'Personal'  # Auto-created for small artists
        BUSINESS = 'business', 'Business'  # Explicitly created by companies
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Approval'  # Business orgs need admin approval
        ACTIVE = 'active', 'Active'
        SUSPENDED = 'suspended', 'Suspended'
        INACTIVE = 'inactive', 'Inactive'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    
    # Organization type
    org_type = models.CharField(
        max_length=20,
        choices=OrganizationType.choices,
        default=OrganizationType.PERSONAL
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    
    # Contact & Details
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    # Business Details (only for business orgs)
    tax_id = models.CharField(max_length=100, blank=True, null=True)  # KRA PIN for Kenya
    registration_number = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Branding
    logo = models.ImageField(upload_to='organization_logos/', blank=True, null=True)
    banner_image = models.ImageField(upload_to='organization_banners/', blank=True, null=True)
    
    # Payment/Banking (encrypted in production)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account = models.CharField(max_length=100, blank=True, null=True)
    mpesa_paybill = models.CharField(max_length=20, blank=True, null=True)  # For Kenya
    
    # Metadata
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_organizations')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'org_type']),
            models.Index(fields=['owner']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_org_type_display()})"
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from name if not provided
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
            
            # Ensure uniqueness
            original_slug = self.slug
            counter = 1
            while Organization.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        
        # Business orgs start as PENDING (needs admin approval)
        if self.org_type == self.OrganizationType.BUSINESS and not self.pk:
            self.status = self.Status.PENDING
        
        super().save(*args, **kwargs)
    
    @property
    def is_personal(self):
        return self.org_type == self.OrganizationType.PERSONAL
    
    @property
    def is_business(self):
        return self.org_type == self.OrganizationType.BUSINESS


class OrganizationMember(models.Model):
    """
    Team members within an organization with specific roles
    """
    
    class Role(models.TextChoices):
        OWNER = 'owner', 'Owner'        # Full control
        ADMIN = 'admin', 'Admin'        # Manage events, team, settings
        MANAGER = 'manager', 'Manager'  # Manage events only
        MEMBER = 'member', 'Member'     # View only
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organization_memberships')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    
    # Permissions (can be expanded)
    can_create_events = models.BooleanField(default=False)
    can_manage_tickets = models.BooleanField(default=False)
    can_manage_team = models.BooleanField(default=False)
    can_view_analytics = models.BooleanField(default=False)
    
    # Status
    is_active = models.BooleanField(default=True)
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='invited_members')
    invited_email = models.EmailField(blank=True, null=True)  # For pending invitations
    
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['organization', 'user']
        ordering = ['organization', '-role']
    
    def __str__(self):
        return f"{self.user.email} - {self.role} at {self.organization.name}"
    
    def save(self, *args, **kwargs):
        # Set permissions based on role
        if self.role == self.Role.OWNER:
            self.can_create_events = True
            self.can_manage_tickets = True
            self.can_manage_team = True
            self.can_view_analytics = True
        elif self.role == self.Role.ADMIN:
            self.can_create_events = True
            self.can_manage_tickets = True
            self.can_manage_team = True
            self.can_view_analytics = True
        elif self.role == self.Role.MANAGER:
            self.can_create_events = True
            self.can_manage_tickets = True
            self.can_manage_team = False
            self.can_view_analytics = True
        elif self.role == self.Role.MEMBER:
            self.can_create_events = False
            self.can_manage_tickets = False
            self.can_manage_team = False
            self.can_view_analytics = False
        
        super().save(*args, **kwargs)