from rest_framework import viewsets, generics, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import Organization, OrganizationMember
from .serializers import (
    OrganizationSerializer,
    OrganizationCreateSerializer,
    OrganizationUpdateSerializer,
    OrganizationMemberSerializer
)
from .permissions import (
    IsOrganizationOwner,
    IsOrganizationAdmin,
    IsOrganizationMember,
    CanManageOrganizationTeam,
    IsAdminOrReadOnly
)

# Add these views to your existing views.py
from django.db.models import Sum, Count, Avg, Q, F
from datetime import timedelta
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.utils import timezone
User = get_user_model()


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Organizations
    """
    queryset = Organization.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrganizationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrganizationUpdateSerializer
        return OrganizationSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            permission_classes = [IsAuthenticated]
        elif self.action == 'list':
            permission_classes = [IsAuthenticated]
        elif self.action == 'retrieve':
            permission_classes = [IsAuthenticated, IsOrganizationMember]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsOrganizationAdmin]
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, IsOrganizationOwner]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Return organizations based on user role:
        - Admin: all organizations
        - Regular users: organizations they are members of
        """
        user = self.request.user
        
        if user.is_staff:
            return Organization.objects.all()
        
        # For regular users, return organizations they're members of
        return Organization.objects.filter(
            Q(owner=user) | 
            Q(members__user=user, members__is_active=True)
        ).distinct()
    
    def perform_create(self, serializer):
        """Set the current user as owner when creating organization"""
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'], permission_classes=[IsOrganizationMember])
    def members(self, request, pk=None):
        """Get all members of an organization"""
        organization = self.get_object()
        members = organization.members.filter(is_active=True)
        serializer = OrganizationMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsOrganizationMember])
    def my_role(self, request, pk=None):
        """Get current user's role in this organization"""
        organization = self.get_object()
        try:
            membership = organization.members.get(user=request.user, is_active=True)
            serializer = OrganizationMemberSerializer(membership)
            return Response(serializer.data)
        except OrganizationMember.DoesNotExist:
            return Response(
                {"detail": "You are not a member of this organization"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[CanManageOrganizationTeam])
    def invite_member(self, request, pk=None):
        """Invite a new member to the organization"""
        organization = self.get_object()
        email = request.data.get('email')
        role = request.data.get('role', OrganizationMember.Role.MEMBER)
        
        if not email:
            return Response(
                {"email": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # User doesn't exist yet - store invitation for when they sign up
            # You might want to send an email invitation here
            return Response(
                {
                    "detail": "User not found. Invitation saved.",
                    "invited_email": email,
                    "status": "pending"
                },
                status=status.HTTP_200_OK
            )
        
        # Check if already a member
        if organization.members.filter(user=user, is_active=True).exists():
            return Response(
                {"detail": "User is already a member of this organization"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create membership
        membership = OrganizationMember.objects.create(
            organization=organization,
            user=user,
            role=role,
            invited_by=request.user,
            invited_email=email
        )
        
        serializer = OrganizationMemberSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrganizationAdmin])
    def update_member_role(self, request, pk=None):
        """Update a member's role"""
        organization = self.get_object()
        user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        
        if not user_id or not new_role:
            return Response(
                {"detail": "user_id and role are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            membership = organization.members.get(
                user_id=user_id,
                is_active=True
            )
            
            # Prevent changing owner's role
            if membership.role == OrganizationMember.Role.OWNER:
                return Response(
                    {"detail": "Cannot change owner's role"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            membership.role = new_role
            membership.save()
            
            serializer = OrganizationMemberSerializer(membership)
            return Response(serializer.data)
            
        except OrganizationMember.DoesNotExist:
            return Response(
                {"detail": "Member not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrganizationAdmin])
    def remove_member(self, request, pk=None):
        """Remove a member from organization"""
        organization = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"detail": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            membership = organization.members.get(
                user_id=user_id,
                is_active=True
            )
            
            # Prevent removing owner
            if membership.role == OrganizationMember.Role.OWNER:
                return Response(
                    {"detail": "Cannot remove organization owner"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Deactivate instead of delete
            membership.is_active = False
            membership.save()
            
            return Response(
                {"detail": "Member removed successfully"},
                status=status.HTTP_200_OK
            )
            
        except OrganizationMember.DoesNotExist:
            return Response(
                {"detail": "Member not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def my_organizations(self, request):
        """Get organizations where current user is owner or member"""
        organizations = Organization.objects.filter(
            Q(owner=request.user) | 
            Q(members__user=request.user, members__is_active=True)
        ).distinct()
        
        # Separate owned vs member organizations
        owned_orgs = organizations.filter(owner=request.user)
        member_orgs = organizations.exclude(owner=request.user)
        
        owned_serializer = self.get_serializer(owned_orgs, many=True)
        member_serializer = self.get_serializer(member_orgs, many=True)
        
        return Response({
            'owned': owned_serializer.data,
            'member_of': member_serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrganizationOwner])
    def request_verification(self, request, pk=None):
        """Request verification for business organization"""
        organization = self.get_object()
        
        if organization.org_type != Organization.OrganizationType.BUSINESS:
            return Response(
                {"detail": "Only business organizations can request verification"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # In production, you might send an email to admin here
        organization.status = Organization.Status.PENDING
        organization.save()
        
        return Response({
            "detail": "Verification requested. Admin will review your organization.",
            "status": organization.status
        })

        
    @action(detail=True, methods=['get'], permission_classes=[IsOrganizationMember])
    def dashboard(self, request, pk=None):
        """Get dashboard data for a specific organization"""
        organization = self.get_object()
        
        # Redirect to the DashboardView logic
        dashboard_view = DashboardView()
        dashboard_view.request = request
        dashboard_view.format_kwarg = self.format_kwarg
        
        return dashboard_view.get(request)
    
    @action(detail=True, methods=['get'], permission_classes=[IsOrganizationMember])
    def events(self, request, pk=None):
        """Get all events for this organization"""
        organization = self.get_object()
        events = organization.events.all()
        page = self.paginate_queryset(events)
        
        if page is not None:
            serializer = EventSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsOrganizationMember])
    def transactions(self, request, pk=None):
        """Get all transactions for this organization"""
        organization = self.get_object()
        transactions = organization.transactions.all()
        page = self.paginate_queryset(transactions)
        
        if page is not None:
            serializer = TransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsOrganizationMember])
    def quick_stats(self, request, pk=None):
        """Get quick stats for dashboard cards"""
        organization = self.get_object()
        
        # Use the QuickStatsView logic
        stats_view = QuickStatsView()
        stats_view.request = request
        stats_view.format_kwarg = self.format_kwarg
        
        return stats_view.get(request)

class OrganizationMemberViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing organization members (admin only)
    """
    serializer_class = OrganizationMemberSerializer
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    
    def get_queryset(self):
        organization_id = self.kwargs.get('organization_pk')
        return OrganizationMember.objects.filter(
            organization_id=organization_id,
            is_active=True
        )
    
    def perform_create(self, serializer):
        organization_id = self.kwargs.get('organization_pk')
        organization = Organization.objects.get(id=organization_id)
        serializer.save(organization=organization, invited_by=self.request.user)


class AdminOrganizationViewSet(viewsets.ModelViewSet):
    """
    Admin-only API for managing all organizations
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['org_type', 'status', 'is_verified']
    search_fields = ['name', 'email', 'tax_id']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending business organization"""
        organization = self.get_object()
        
        if organization.status != Organization.Status.PENDING:
            return Response(
                {"detail": "Organization is not pending approval"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        organization.status = Organization.Status.ACTIVE
        organization.is_verified = True
        organization.save()
        
        # Send notification email to owner (implement in production)
        
        return Response({
            "detail": "Organization approved successfully",
            "status": organization.status,
            "is_verified": organization.is_verified
        })
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend an organization"""
        organization = self.get_object()
        reason = request.data.get('reason', '')
        
        organization.status = Organization.Status.SUSPENDED
        organization.save()
        
        # Log suspension reason (you might want a separate model for this)
        # Send notification to owner
        
        return Response({
            "detail": f"Organization suspended. Reason: {reason}",
            "status": organization.status
        })
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Reactivate a suspended organization"""
        organization = self.get_object()
        
        if organization.status != Organization.Status.SUSPENDED:
            return Response(
                {"detail": "Organization is not suspended"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        organization.status = Organization.Status.ACTIVE
        organization.save()
        
        return Response({
            "detail": "Organization activated successfully",
            "status": organization.status
        })
    

from .models import Event, Transaction, DashboardMetric
from .serializers import (
    EventSerializer, TransactionSerializer,
    DashboardMetricsSerializer, RevenueChartDataSerializer,
    EventTypeDistributionSerializer, RecentTransactionSerializer,
    UpcomingEventSerializer, QuickStatsSerializer
)


class DashboardView(APIView):
    """Main dashboard endpoint for organizations"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get user's primary organization
        user = request.user
        
        # First, try to get an organization the user owns
        organization = Organization.objects.filter(owner=user).first()
        
        if not organization:
            # If user doesn't own an organization, check if they're a member
            organization = Organization.objects.filter(
                members__user=user, 
                members__is_active=True
            ).first()
        
        if not organization:
            return Response(
                {'error': 'No organization found for user'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has view analytics permission
        try:
            membership = organization.members.get(user=user, is_active=True)
            if not membership.can_view_analytics:
                return Response(
                    {'error': 'You do not have permission to view analytics'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except OrganizationMember.DoesNotExist:
            # User is not a member (should not happen based on previous query)
            return Response(
                {'error': 'You are not a member of this organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Calculate time ranges
        today = timezone.now().date()
        thirty_days_ago = today - timedelta(days=30)
        six_months_ago = today - timedelta(days=180)
        
        # 1. Dashboard Metrics
        total_revenue = organization.events.aggregate(
            total=Sum('total_revenue')
        )['total'] or 0
        
        active_events = organization.events.filter(
            Q(status='active') | Q(status='live'),
            end_date__gte=timezone.now()
        ).count()
        
        total_attendees = organization.events.aggregate(
            total=Sum('attendees_count')
        )['total'] or 0
        
        # Average ticket price
        events_with_tickets = organization.events.filter(total_tickets_sold__gt=0)
        if events_with_tickets.exists():
            total_sales = events_with_tickets.aggregate(total=Sum('total_revenue'))['total'] or 0
            total_tickets = events_with_tickets.aggregate(total=Sum('total_tickets_sold'))['total'] or 0
            avg_ticket_price = total_sales / total_tickets if total_tickets > 0 else 0
        else:
            avg_ticket_price = 1250.00  # Default value
        
        # Conversion rate (simplified - would come from analytics in production)
        conversion_rate = 0.25
        
        # Revenue growth (last 30 days vs previous 30 days)
        recent_revenue = Transaction.objects.filter(
            organization=organization,
            transaction_type='ticket_purchase',
            status='completed',
            created_at__date__gte=thirty_days_ago
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        previous_period_start = thirty_days_ago - timedelta(days=30)
        previous_revenue = Transaction.objects.filter(
            organization=organization,
            transaction_type='ticket_purchase',
            status='completed',
            created_at__date__gte=previous_period_start,
            created_at__date__lt=thirty_days_ago
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        if previous_revenue > 0:
            revenue_growth = ((recent_revenue - previous_revenue) / previous_revenue) * 100
        else:
            revenue_growth = 100.0 if recent_revenue > 0 else 0.0
        
        transaction_volume = Transaction.objects.filter(
            organization=organization,
            status='completed'
        ).count()
        
        metrics_data = {
            'total_revenue': float(total_revenue),
            'active_events': active_events,
            'total_attendees': total_attendees,
            'avg_ticket_price': float(avg_ticket_price),
            'conversion_rate': conversion_rate * 100,  # Convert to percentage
            'revenue_growth': revenue_growth,
            'transaction_volume': transaction_volume,
        }
        
        # 2. Revenue Chart Data (Last 6 months)
        revenue_chart_data = []
        for i in range(6):
            month_start = today.replace(day=1) - timedelta(days=30 * i)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_revenue = Transaction.objects.filter(
                organization=organization,
                transaction_type='ticket_purchase',
                status='completed',
                created_at__date__gte=month_start,
                created_at__date__lte=month_end
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            tickets_sold = Transaction.objects.filter(
                organization=organization,
                transaction_type='ticket_purchase',
                status='completed',
                created_at__date__gte=month_start,
                created_at__date__lte=month_end
            ).count()
            
            avg_price = float(month_revenue / tickets_sold) if tickets_sold > 0 else 0
            
            revenue_chart_data.append({
                'date': month_start,
                'revenue': float(month_revenue),
                'tickets_sold': tickets_sold,
                'avg_ticket_price': avg_price,
            })
        
        revenue_chart_data.reverse()  # Oldest to newest
        
        # 3. Event Type Distribution
        event_types = organization.events.values('event_type').annotate(
            count=Count('id'),
            revenue=Sum('total_revenue')
        ).order_by('-revenue')
        
        total_events = organization.events.count()
        event_type_data = []
        
        for et in event_types:
            percentage = (et['count'] / total_events * 100) if total_events > 0 else 0
            event_type_data.append({
                'event_type': et['event_type'],
                'count': et['count'],
                'revenue': float(et['revenue'] or 0),
                'percentage': percentage,
            })
        
        # 4. Recent Transactions (Last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_transactions = Transaction.objects.filter(
            organization=organization,
            created_at__gte=week_ago
        ).order_by('-created_at')[:10]
        
        transaction_data = []
        for tx in recent_transactions:
            transaction_data.append({
                'id': tx.transaction_id or str(tx.id),
                'description': tx.description or f"{tx.get_transaction_type_display()}",
                'amount': float(tx.amount),
                'type': 'income' if tx.transaction_type == 'ticket_purchase' else 'expense',
                'date': tx.created_at,
                'status': tx.status,
            })
        
        # 5. Upcoming Events (Next 30 days)
        thirty_days_later = timezone.now() + timedelta(days=30)
        upcoming_events = organization.events.filter(
            Q(status='active') | Q(status='upcoming'),
            start_date__gte=timezone.now(),
            start_date__lte=thirty_days_later
        ).order_by('start_date')[:5]
        
        upcoming_data = []
        for event in upcoming_events:
            upcoming_data.append({
                'id': str(event.id),
                'title': event.title,
                'date': event.start_date or event.created_at,
                'attendees': event.attendees_count,
                'status': event.status,
                'revenue': float(event.total_revenue),
            })
        
        # Return all dashboard data
        return Response({
            'organization': {
                'id': str(organization.id),
                'name': organization.name,
                'logo': organization.logo.url if organization.logo else None,
                'type': organization.org_type,
                'is_verified': organization.is_verified,
            },
            'metrics': metrics_data,
            'revenue_chart': revenue_chart_data,
            'event_types': event_type_data,
            'recent_transactions': transaction_data,
            'upcoming_events': upcoming_data,
        })


class QuickStatsView(APIView):
    """Quick stats for dashboard cards"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get user's organization
        organization = Organization.objects.filter(
            Q(owner=request.user) | 
            Q(members__user=request.user, members__is_active=True)
        ).first()
        
        if not organization:
            return Response({'error': 'No organization found'}, status=404)
        
        # Real-time stats
        today = timezone.now().date()
        
        today_revenue = Transaction.objects.filter(
            organization=organization,
            transaction_type='ticket_purchase',
            status='completed',
            created_at__date=today
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        week_revenue = Transaction.objects.filter(
            organization=organization,
            transaction_type='ticket_purchase',
            status='completed',
            created_at__date__gte=today - timedelta(days=7)
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        pending_payouts = Transaction.objects.filter(
            organization=organization,
            transaction_type='payout',
            status='pending'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        live_events = organization.events.filter(
            status='live'
        ).count()
        
        total_events = organization.events.count()
        
        stats = {
            'today_revenue': float(today_revenue),
            'week_revenue': float(week_revenue),
            'pending_payouts': float(pending_payouts),
            'live_events': live_events,
            'total_events': total_events,
        }
        
        serializer = QuickStatsSerializer(stats)
        return Response(serializer.data)


class EventAnalyticsView(generics.RetrieveAPIView):
    """Detailed analytics for a specific event"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, *args, **kwargs):
        event = self.get_object()
        
        # Check if user has access to this event's organization
        if not (event.organization.owner == request.user or 
                event.organization.members.filter(user=request.user, is_active=True).exists()):
            return Response({'error': 'Permission denied'}, status=403)
        
        # Check if user has view analytics permission
        try:
            membership = event.organization.members.get(user=request.user, is_active=True)
            if not membership.can_view_analytics:
                return Response({'error': 'No permission to view analytics'}, status=403)
        except OrganizationMember.DoesNotExist:
            return Response({'error': 'Not a member of this organization'}, status=403)
        
        # Event analytics
        ticket_sales = Transaction.objects.filter(
            event=event,
            transaction_type='ticket_purchase',
            status='completed'
        )
        
        total_sales = ticket_sales.aggregate(total=Sum('amount'))['total'] or 0
        total_tickets = ticket_sales.count()
        
        # Daily sales breakdown (last 7 days)
        daily_sales = []
        for i in range(7):
            date = timezone.now().date() - timedelta(days=i)
            day_sales = ticket_sales.filter(created_at__date=date).aggregate(total=Sum('amount'))['total'] or 0
            daily_sales.append({
                'date': date,
                'sales': float(day_sales),
            })
        
        # Ticket type breakdown
        ticket_types = event.ticket_types.all()
        ticket_type_breakdown = []
        for tt in ticket_types:
            ticket_type_breakdown.append({
                'name': tt.name,
                'price': float(tt.price),
                'sold': tt.sold_count,
                'revenue': float(tt.revenue),
                'available': tt.available_quantity,
            })
        
        # Attendee check-in rate
        # Note: You'll need to add a check-in system for this to work
        # For now, we'll return mock data
        checkin_rate = 0.75  # 75% check-in rate
        
        return Response({
            'event': EventSerializer(event).data,
            'analytics': {
                'total_sales': float(total_sales),
                'total_tickets': total_tickets,
                'daily_sales': daily_sales,
                'ticket_type_breakdown': ticket_type_breakdown,
                'attendee_count': event.attendees_count,
                'checkin_rate': checkin_rate * 100,  # Convert to percentage
                'avg_ticket_price': float(total_sales / total_tickets) if total_tickets > 0 else 0,
            }
        })