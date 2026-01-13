# backend/apps/core/models.py - Country-specific settings
import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class Country(models.Model):
    """African countries we operate in"""
    code = models.CharField(max_length=2, primary_key=True)  # ISO code
    name = models.CharField(max_length=100)
    currency = models.CharField(max_length=3)  # KES, NGN, GHS, etc.
    currency_symbol = models.CharField(max_length=5)
    language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='Africa/Nairobi')
    
    # Payment methods available
    supports_mpesa = models.BooleanField(default=False)
    supports_airtel_money = models.BooleanField(default=False)
    supports_card = models.BooleanField(default=True)
    supports_bank_transfer = models.BooleanField(default=True)
    
    # Legal
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=16.0)  # VAT %
    tax_name = models.CharField(max_length=50, default='VAT')
    
    # Settings
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    phone_code = models.CharField(max_length=5, default='+254')
    phone_length = models.IntegerField(default=10)
    
    class Meta:
        db_table = 'deevents_countries'
        verbose_name_plural = 'Countries'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class CountryConfiguration(models.Model):
    """Country-specific business rules"""
    country = models.OneToOneField(Country, on_delete=models.CASCADE, primary_key=True)
    
    # Ticket limits
    max_tickets_per_user = models.IntegerField(default=10)
    max_resale_percentage = models.IntegerField(default=120)  # Max 120% of face value
    
    # Fees
    platform_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=3.0)
    min_platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=50.0)  # Min 50 KES
    
    # Payout
    min_payout_amount = models.DecimalField(max_digits=10, decimal_places=2, default=500.0)  # Min 500 KES
    payout_processing_days = models.IntegerField(default=3)  # Business days
    
    # Compliance
    requires_kyc_for_organizers = models.BooleanField(default=True)
    requires_kyc_for_attendees = models.BooleanField(default=False)
    kyc_document_types = models.JSONField(default=list)  # ['national_id', 'passport']
    
    # Localization
    date_format = models.CharField(max_length=20, default='dd/mm/yyyy')
    time_format = models.CharField(max_length=10, default='12h')  # or 24h
    
    class Meta:
        db_table = 'deevents_country_configurations'
    
    def __str__(self):
        return f"Configuration for {self.country.name}"


# Add to User model for country detection
class User(models.Model):
    # ... existing fields ...
    
    # Enhanced country field
    country = models.ForeignKey(
        Country, 
        on_delete=models.SET_NULL, 
        null=True, 
        default='KE',  # Default to Kenya
        related_name='users'
    )
    
    # Kenyan-specific fields
    mpesa_number = models.CharField(max_length=15, blank=True, null=True)
    id_number = models.CharField(max_length=20, blank=True, null=True)  # National ID