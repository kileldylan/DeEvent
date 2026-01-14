from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from organizations.models import Organization  # adjust import as needed
# from events.models import Event, Ticket  # uncomment when ready

from .models import PlatformStat
from .serializers import AdminStatsSerializer

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)

        # Try to get latest cached stat
        latest_stat = PlatformStat.objects.order_by('-date').first()

        if latest_stat and latest_stat.date == today:
            # Return cached if fresh
            serializer = AdminStatsSerializer(latest_stat)
            return Response(serializer.data)

        # Otherwise compute fresh
        stats = {
            "total_users": User.objects.count(),
            "new_users": User.objects.filter(date_joined__date=today).count(),
            "active_users_30d": User.objects.filter(last_login__gte=last_30_days).count(),
            "total_organizers": User.objects.filter(is_organizer=True).count(),
            "total_organizations": Organization.objects.count(),
            "pending_kyc": Organization.objects.filter(kyc_verification__status='pending').count() if hasattr(Organization, 'kyc_verification') else 0,
            # Add when events ready:
            # "total_events": Event.objects.count(),
            # "active_events": Event.objects.filter(status='active').count(),
            # "total_tickets_sold": Ticket.objects.count(),
            # "total_revenue_kes": Ticket.objects.aggregate(total=Sum('price_kes'))['total'] or 0,
            # "total_revenue_crypto": Ticket.objects.aggregate(total=Sum('price_crypto'))['total'] or 0,
            # "pending_payouts": Payout.objects.filter(status='pending').count(),
            # "pending_disputes": Dispute.objects.filter(status='pending').count(),
        }

        # Save to cache for next request
        PlatformStat.objects.create(date=today, **stats)

        return Response(stats)