'use client';
import { api } from '@/lib/api';

// Function to dynamically load Razorpay script
const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
            resolve(true);
        };
        
        script.onerror = () => {
            reject(new Error('Failed to load Razorpay SDK'));
        };
        
        document.head.appendChild(script);
    });
};

export const openRazorpayCheckout = async (orderData, onSuccess, onFailure) => {
    try {
        // Load Razorpay script dynamically
        await loadRazorpayScript();
        
        if (typeof window === 'undefined' || !window.Razorpay) {
            onFailure('Razorpay SDK not loaded');
            return;
        }

        const options = {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'StreamVerse',
            description: `${orderData.plan_name} Subscription`,
            order_id: orderData.order_id,
            prefill: {
                name: orderData.user_name,
                email: orderData.user_email,
            },
            theme: {
                color: '#3B82F6', // Blue color matching your theme
            },
            handler: async function (response) {
                // Payment successful, verify with backend
                try {
                    const token = localStorage.getItem('access_token');
                    const verificationData = {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        plan_id: orderData.plan_id,
                        billing_cycle: orderData.billing_cycle,
                    };

                    const result = await api.verifyPayment(token, verificationData);
                    onSuccess(result);
                } catch (error) {
                    onFailure(error.message || 'Payment verification failed');
                }
            },
            modal: {
                ondismiss: function () {
                    onFailure('Payment cancelled by user');
                },
            },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
    } catch (error) {
        onFailure('Failed to load payment gateway');
    }
};
