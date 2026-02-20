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

    # Add these models to your existing models.py

class DashboardMetric(models.Model):
    """Dashboard metrics for quick retrieval and caching"""
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='dashboard_metrics')
    metric_type = models.CharField(max_length=100)  # 'total_revenue', 'active_events', etc.
    value = models.JSONField()  # Can store different types of values
    period = models.CharField(max_length=20, default='all')  # 'daily', 'weekly', 'monthly', 'all'
    
    calculated_at = models.DateTimeField(auto_now=True)
    valid_until = models.DateTimeField()
    
    class Meta:
        unique_together = ['organization', 'metric_type', 'period']
        indexes = [
            models.Index(fields=['organization', 'metric_type', 'valid_until']),
        ]
    
    def __str__(self):
        return f"{self.organization.name} - {self.metric_type} ({self.period})"


class Event(models.Model):
    """Event model with financial tracking"""
    EVENT_TYPES = [
        ('music', 'Music'),
        ('gospel', 'Gospel Concert'),
        ('koroga', 'Koroga Festival'),
        ('nyama_choma', 'Nyama Choma Festival'),
        ('comedy', 'Comedy Show'),
        ('conference', 'Conference'),
        ('workshop', 'Workshop'),
        ('sports', 'Sports Event'),
        ('wedding', 'Wedding'),
        ('fundraiser', 'Fundraiser'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('active', 'Active'),
        ('live', 'Live Now'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    
    # Financial tracking
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_tickets_sold = models.PositiveIntegerField(default=0)
    attendees_count = models.PositiveIntegerField(default=0)
    
    # Location
    venue_name = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    county = models.CharField(max_length=100, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Timestamps
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def is_live(self):
        from django.utils import timezone
        now = timezone.now()
        if self.start_date and self.end_date:
            return self.start_date <= now <= self.end_date
        return False
    
    @property
    def days_until(self):
        from django.utils import timezone
        if self.start_date and self.start_date > timezone.now():
            delta = self.start_date - timezone.now()
            return delta.days
        return 0


class Transaction(models.Model):
    """Financial transactions for events"""
    TRANSACTION_TYPES = [
        ('ticket_purchase', 'Ticket Purchase'),
        ('refund', 'Refund'),
        ('payout', 'Payout to Organizer'),
        ('withdrawal', 'Withdrawal'),
        ('commission', 'Platform Commission'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHODS = [
        ('mpesa', 'M-Pesa'),
        ('card', 'Credit/Debit Card'),
        ('bank', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='transactions')
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    
    # Transaction details
    transaction_id = models.CharField(max_length=50, unique=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=50, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='mpesa')
    
    # Metadata
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'transaction_type', 'created_at']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.transaction_id} - {self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.transaction_id:
            from django.utils import timezone
            date_str = timezone.now().strftime('%Y%m%d')
            last_tx = Transaction.objects.filter(
                transaction_id__startswith=f"TX-{date_str}-"
            ).order_by('transaction_id').last()
            
            if last_tx:
                last_num = int(last_tx.transaction_id.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            self.transaction_id = f"TX-{date_str}-{new_num:05d}"
        
        super().save(*args, **kwargs)
    
    @property
    def is_income(self):
        return self.transaction_type == 'ticket_purchase'
    
    @property
    def is_expense(self):
        return self.transaction_type in ['refund', 'payout', 'withdrawal', 'commission']


class TicketType(models.Model):
    """Ticket types for events"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ticket_types')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    
    # Quantity
    quantity = models.PositiveIntegerField()
    sold_count = models.PositiveIntegerField(default=0)
    
    # Timing
    sale_start = models.DateTimeField(null=True, blank=True)
    sale_end = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name} - {self.event.title}"
    
    @property
    def available_quantity(self):
        return self.quantity - self.sold_count
    
    @property
    def revenue(self):
        return self.price * self.sold_count