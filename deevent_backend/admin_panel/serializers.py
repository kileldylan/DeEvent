from rest_framework import serializers
from .models import PlatformStat

class AdminStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformStat
        fields = [
            'total_users', 'new_users', 'active_users_30d',
            'total_organizers', 'total_organizations', 'pending_kyc',
            'total_events', 'active_events',
            'total_tickets_sold', 'total_revenue_kes', 'total_revenue_crypto',
            'pending_payouts', 'pending_disputes',
            'date', 'updated_at'
        ]
        read_only_fields = fields