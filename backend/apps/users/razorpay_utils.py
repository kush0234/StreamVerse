"""
Razorpay utility functions for payment processing
"""
import razorpay
from django.conf import settings
import hmac
import hashlib


def get_razorpay_client():
    """Initialize and return Razorpay client"""
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_razorpay_order(amount, currency='INR', receipt=None):
    """
    Create a Razorpay order
    
    Args:
        amount: Amount in smallest currency unit (paise for INR)
        currency: Currency code (default: INR)
        receipt: Optional receipt ID for reference
    
    Returns:
        dict: Order details from Razorpay
    """
    client = get_razorpay_client()
    
    order_data = {
        'amount': int(amount * 100),  # Convert to paise
        'currency': currency,
        'payment_capture': 1  # Auto capture payment
    }
    
    if receipt:
        order_data['receipt'] = receipt
    
    order = client.order.create(data=order_data)
    return order


def verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """
    Verify Razorpay payment signature for security
    
    Args:
        razorpay_order_id: Order ID from Razorpay
        razorpay_payment_id: Payment ID from Razorpay
        razorpay_signature: Signature from Razorpay
    
    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        client = get_razorpay_client()
        
        # Verify signature
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        
        client.utility.verify_payment_signature(params_dict)
        return True
    except razorpay.errors.SignatureVerificationError:
        return False


def verify_webhook_signature(webhook_body, webhook_signature):
    """
    Verify webhook signature from Razorpay
    
    Args:
        webhook_body: Raw webhook body
        webhook_signature: Signature from webhook header
    
    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
            webhook_body.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, webhook_signature)
    except Exception:
        return False


def fetch_payment_details(payment_id):
    """
    Fetch payment details from Razorpay
    
    Args:
        payment_id: Razorpay payment ID
    
    Returns:
        dict: Payment details
    """
    client = get_razorpay_client()
    return client.payment.fetch(payment_id)
