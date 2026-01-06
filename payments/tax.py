# backend/apps/payments/tax.py
from decimal import Decimal
from django.conf import settings

class KenyaTaxCalculator:
    """Calculate taxes for Kenya"""
    
    def __init__(self, amount, is_business=False):
        self.amount = Decimal(str(amount))
        self.is_business = is_business
        self.vat_rate = Decimal('0.16')  # 16% VAT in Kenya
    
    def calculate_vat(self):
        """Calculate VAT amount"""
        if self.is_business:
            # Businesses pay VAT
            vat_amount = self.amount * self.vat_rate
            return {
                'vat_amount': round(vat_amount, 2),
                'net_amount': round(self.amount - vat_amount, 2),
                'vat_rate': self.vat_rate
            }
        else:
            # For consumers, VAT is included in price
            vat_amount = self.amount * self.vat_rate / (1 + self.vat_rate)
            return {
                'vat_amount': round(vat_amount, 2),
                'net_amount': round(self.amount - vat_amount, 2),
                'vat_rate': self.vat_rate
            }
    
    def calculate_withholding_tax(self, amount, is_resident=True):
        """Calculate withholding tax (for payouts to organizers)"""
        if is_resident:
            rate = Decimal('0.05')  # 5% for residents
        else:
            rate = Decimal('0.20')  # 20% for non-residents
        
        withholding_tax = amount * rate
        return {
            'withholding_tax': round(withholding_tax, 2),
            'net_payout': round(amount - withholding_tax, 2),
            'rate': rate
        }
    
    def generate_receipt_details(self, ticket_price, service_fee):
        """Generate detailed receipt breakdown for Kenyan customers"""
        total = ticket_price + service_fee
        
        # VAT calculation (VAT on service fee only in Kenya)
        vat_on_service = service_fee * self.vat_rate / (1 + self.vat_rate)
        net_service_fee = service_fee - vat_on_service
        
        breakdown = {
            'ticket_price': round(ticket_price, 2),
            'service_fee': round(service_fee, 2),
            'vat': {
                'amount': round(vat_on_service, 2),
                'rate': f"{self.vat_rate * 100}%",
                'on': 'service_fee'
            },
            'subtotal': round(ticket_price + net_service_fee, 2),
            'total': round(total, 2),
            'currency': 'KES'
        }
        
        return breakdown