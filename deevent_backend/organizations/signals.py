from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Organization, OrganizationMember

User = get_user_model()

@receiver(post_save, sender=User)
def create_personal_organization(sender, instance, created, **kwargs):
    """
    Auto-create a personal organization when a new user signs up
    (Assuming all users can be organizers - adjust as needed)
    """
    if created:
        # Check if user should get an auto-organization
        # You might want to check user type/role here
        from django.utils.text import slugify
        
        org_name = f"{instance.first_name}'s Events" if instance.first_name else f"{instance.username}'s Events"
        
        organization = Organization.objects.create(
            name=org_name,
            owner=instance,
            org_type=Organization.OrganizationType.PERSONAL,
            email=instance.email,
            is_verified=False
        )
        
        # Add user as OWNER of their personal organization
        OrganizationMember.objects.create(
            organization=organization,
            user=instance,
            role=OrganizationMember.Role.OWNER
        )