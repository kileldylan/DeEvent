# backend/apps/payments/mpesa.py
import requests
import base64
from datetime import datetime
import json
from django.conf import settings
from django.utils import timezone

class MpesaGateway:
    """M-Pesa API Integration for Kenya"""
    
    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.business_shortcode = settings.MPESA_BUSINESS_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        self.callback_url = settings.MPESA_CALLBACK_URL
        
        # Sandbox/Production URLs
        if settings.DEBUG:
            self.base_url = "https://sandbox.safaricom.co.ke"
        else:
            self.base_url = "https://api.safaricom.co.ke"
    
    def get_access_token(self):
        """Get OAuth access token from Safaricom"""
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        
        # Base64 encode consumer key and secret
        auth_string = f"{self.consumer_key}:{self.consumer_secret}"
        encoded_auth = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_auth}"
        }
        
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            raise Exception(f"M-Pesa token error: {response.text}")
    
    def generate_password(self):
        """Generate M-Pesa API password"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        data = f"{self.business_shortcode}{self.passkey}{timestamp}"
        encoded = base64.b64encode(data.encode()).decode()
        return encoded, timestamp
    
    def stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """Initiate STK Push (Customer initiates payment)"""
        access_token = self.get_access_token()
        password, timestamp = self.generate_password()
        
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Format phone number (strip +254 if present, add 254)
        if phone_number.startswith('+'):
            phone_number = phone_number[1:]
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif not phone_number.startswith('254'):
            phone_number = '254' + phone_number
        
        payload = {
            "BusinessShortCode": self.business_shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": str(int(amount)),  # Whole number
            "PartyA": phone_number,
            "PartyB": self.business_shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference[:12],  # Max 12 chars
            "TransactionDesc": transaction_desc[:13]  # Max 13 chars
        }
        
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
    
    def b2c_payment(self, phone_number, amount, remarks):
        """Business to Customer payment (payouts to organizers)"""
        access_token = self.get_access_token()
        
        url = f"{self.base_url}/mpesa/b2c/v1/paymentrequest"
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Format phone number
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        
        payload = {
            "InitiatorName": settings.MPESA_INITIATOR_NAME,
            "SecurityCredential": settings.MPESA_SECURITY_CREDENTIAL,
            "CommandID": "BusinessPayment",
            "Amount": str(int(amount)),
            "PartyA": self.business_shortcode,
            "PartyB": phone_number,
            "Remarks": remarks[:100],
            "QueueTimeOutURL": settings.MPESA_TIMEOUT_URL,
            "ResultURL": settings.MPESA_RESULT_URL,
            "Occasion": "Event Payout"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        return response.json()