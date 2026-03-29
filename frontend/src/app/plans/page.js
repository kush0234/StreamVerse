'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { openRazorpayCheckout } from '@/components/RazorpayCheckout';

export default function PlansPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.getSubscriptionPlans();
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (planName) => {
    const colors = {
      'BASIC': 'from-gray-600 to-gray-800',
      'STANDARD': 'from-blue-600 to-blue-800',
      'PREMIUM': 'from-purple-600 to-pink-600',
    };
    return colors[planName] || 'from-gray-600 to-gray-800';
  };

  const getPlanIcon = (planName) => {
    const icons = {
      'BASIC': '🥉',
      'STANDARD': '🥈',
      'PREMIUM': '🥇',
    };
    return icons[planName] || '📦';
  };

  const getPlanFeatures = (plan) => {
    const features = [
      `Watch on ${plan.max_simultaneous_streams} device${plan.max_simultaneous_streams > 1 ? 's' : ''} at a time`,
      `${plan.video_quality} quality streaming`,
      `Up to ${plan.max_profiles} profiles`,
      'Full content library',
    ];

    if (plan.has_ads) {
      features.push('Ads included');
    } else {
      features.push('Ad-free experience');
    }

    if (plan.can_download) {
      features.push('Download for offline viewing');
    }

    if (plan.priority_support) {
      features.push('Priority customer support');
    }

    return features;
  };

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
  };

  const getSavings = (plan) => {
    return plan.savings || 0;
  };

  const handleSelectPlan = async (plan) => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    if (processing) return;

    setSelectedPlan(plan);
    setProcessing(true);

    try {
      // Initiate payment
      const orderData = await api.initiatePayment(
        token,
        plan.id,
        billingCycle.toUpperCase()
      );

      // Add plan details for checkout
      orderData.plan_id = plan.id;
      orderData.billing_cycle = billingCycle.toUpperCase();

      // Open Razorpay checkout
      openRazorpayCheckout(
        orderData,
        (result) => {
          // Payment successful
          setProcessing(false);
          alert(`Successfully subscribed to ${plan.display_name} plan!`);
          router.push('/account');
        },
        (error) => {
          // Payment failed or cancelled
          setProcessing(false);
          setSelectedPlan(null);
          alert(error || 'Payment failed. Please try again.');
        }
      );
    } catch (error) {
      setProcessing(false);
      setSelectedPlan(null);
      alert(error.message || 'Failed to initiate payment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 px-4 sm:px-8 py-12 flex items-center justify-center">
          <div className="text-xl">Loading plans...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-20 px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 md:mb-8">
            Unlimited entertainment. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex bg-gray-900 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-3 rounded-full font-semibold transition ${billingCycle === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-8 py-3 rounded-full font-semibold transition relative ${billingCycle === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          {plans.map((plan) => {
            const isPopular = plan.name === 'STANDARD';
            return (
              <div
                key={plan.id}
                className={`relative bg-gray-900/50 rounded-2xl p-8 border-2 transition-all hover:scale-105 ${isPopular
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'border-gray-800 hover:border-gray-700'
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${getPlanColor(plan.name)} flex items-center justify-center`}>
                    <span className="text-3xl">{getPlanIcon(plan.name)}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.display_name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">₹{getPrice(plan)}</span>
                    <span className="text-gray-400">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  {billingCycle === 'yearly' && getSavings(plan) > 0 && (
                    <p className="text-sm text-green-400">
                      Save ₹{getSavings(plan)} per year
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {getPlanFeatures(plan).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={processing && selectedPlan?.id === plan.id}
                  className={`w-full py-4 rounded-lg font-semibold transition ${isPopular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                    } ${processing && selectedPlan?.id === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processing && selectedPlan?.id === plan.id ? 'Processing...' : `Choose ${plan.display_name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="max-w-7xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>
          <div className="bg-gray-900/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left">Features</th>
                    {plans.map(plan => (
                      <th key={plan.id} className="px-6 py-4 text-center">{plan.display_name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-6 py-4">Monthly Price</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="px-6 py-4 text-center">₹{plan.monthly_price}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Video Quality</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="px-6 py-4 text-center">{plan.video_quality}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Simultaneous Streams</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="px-6 py-4 text-center">{plan.max_simultaneous_streams}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Profiles</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="px-6 py-4 text-center">{plan.max_profiles}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Download Content</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="px-6 py-4 text-center">{plan.can_download ? '✅' : '❌'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Ads</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="px-6 py-4 text-center">{plan.has_ads ? 'Yes' : 'No'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Priority Support</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="px-6 py-4 text-center">{plan.priority_support ? '✅' : '❌'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I change my plan later?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, debit cards, UPI, and net banking.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely! You can cancel your subscription at any time with no cancellation fees.'
              },
              {
                q: 'Do you offer a free trial?',
                a: 'Yes, new users get a 7-day free trial on any plan. No credit card required.'
              },
              {
                q: 'Can I share my account?',
                a: 'You can create multiple profiles within your account, but sharing login credentials is against our terms of service.'
              }
            ].map((faq, index) => (
              <details
                key={index}
                className="bg-gray-900/50 rounded-lg p-6 cursor-pointer hover:bg-gray-900/70 transition"
              >
                <summary className="font-semibold text-lg">{faq.q}</summary>
                <p className="mt-3 text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">
            Already have an account?
          </p>
          <button
            onClick={() => router.push('/account')}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Go to Account Settings →
          </button>
        </div>
      </div>
    </div>
  );
}
