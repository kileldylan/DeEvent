# admin_panel/models.py
from django.db import models
from django.utils import timezone

class PlatformStat(models.Model):
    """Daily/weekly aggregated stats for fast dashboard loading"""
    date = models.DateField(default=timezone.now, unique=True)
    
    # Users
    total_users = models.PositiveIntegerField(default=0)
    new_users = models.PositiveIntegerField(default=0)
    active_users_30d = models.PositiveIntegerField(default=0)
    
    # Organizers & Organizations
    total_organizers = models.PositiveIntegerField(default=0)
    total_organizations = models.PositiveIntegerField(default=0)
    pending_kyc = models.PositiveIntegerField(default=0)
    
    # Events & Tickets (placeholders - fill when events app ready)
    total_events = models.PositiveIntegerField(default=0)
    active_events = models.PositiveIntegerField(default=0)
    total_tickets_sold = models.PositiveIntegerField(default=0)
    total_revenue_kes = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_revenue_crypto = models.DecimalField(max_digits=15, decimal_places=8, default=0)
    
    # Payouts & Disputes
    pending_payouts = models.PositiveIntegerField(default=0)
    pending_disputes = models.PositiveIntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Platform Statistic"
        verbose_name_plural = "Platform Statistics"
        ordering = ['-date']

    def __str__(self):
        return f"Stats for {self.date}"