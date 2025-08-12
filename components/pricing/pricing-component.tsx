/**
 * Enhanced Pricing Component
 * Integrates with subscription system and Stripe checkout
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Heart } from 'lucide-react';
import { PRICING_PLANS, formatPrice } from '@/lib/pricing';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { PromoCodeInput } from './promo-code-input';
import type { PromoCodeValidation } from '@/lib/promo-codes';

interface PricingComponentProps {
  currentTier?: 'Explorer' | 'Growth' | 'Transformation';
  showCurrentPlan?: boolean;
}

export function PricingComponent({ currentTier = 'Explorer', showCurrentPlan = false }: PricingComponentProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [appliedPromos, setAppliedPromos] = useState<Record<string, PromoCodeValidation>>({});
  const { user } = useAuth();

  const handlePromoApplied = (tier: string, validation: PromoCodeValidation) => {
    setAppliedPromos(prev => ({
      ...prev,
      [tier]: validation
    }));
  };

  const handlePromoRemoved = (tier: string) => {
    setAppliedPromos(prev => {
      const newPromos = { ...prev };
      delete newPromos[tier];
      return newPromos;
    });
  };

  const handleSubscribe = async (tier: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to upgrade your plan.',
        variant: 'destructive'
      });
      return;
    }

    if (tier.toLowerCase() === 'explorer') {
      toast({
        title: 'Already on Free Plan',
        description: 'You\'re currently on the Explorer plan.',
      });
      return;
    }

    setLoadingPlan(tier.toLowerCase());

    try {
      const priceId = isYearly ? 
        PRICING_PLANS.find(p => p.tier.toLowerCase() === tier.toLowerCase())?.stripePriceIds.yearly :
        PRICING_PLANS.find(p => p.tier.toLowerCase() === tier.toLowerCase())?.stripePriceIds.monthly;

      if (!priceId) {
        throw new Error('Price ID not found');
      }

      // Include promo code in checkout session if applied
      const appliedPromo = appliedPromos[tier];
      const requestBody: any = {
        priceId,
        userId: user.uid
      };

      if (appliedPromo?.isValid && appliedPromo.promoCode) {
        requestBody.promoCode = appliedPromo.promoCode.code;
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Checkout
      window.location.href = url;

    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription Error',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPlanIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'explorer':
        return <Heart className="w-6 h-6" />;
      case 'growth':
        return <Star className="w-6 h-6" />;
      case 'transformation':
        return <Zap className="w-6 h-6" />;
      default:
        return <Heart className="w-6 h-6" />;
    }
  };

  const isCurrentPlan = (tier: string) => {
    return currentTier.toLowerCase() === tier.toLowerCase();
  };

  const getButtonText = (tier: string) => {
    if (tier.toLowerCase() === 'explorer') return 'Current Plan';
    if (isCurrentPlan(tier)) return 'Current Plan';
    return loadingPlan === tier.toLowerCase() ? 'Loading...' : 'Upgrade Now';
  };

  const getButtonVariant = (tier: string) => {
    if (isCurrentPlan(tier)) return 'outline';
    if (tier.toLowerCase() === 'growth') return 'default';
    if (tier.toLowerCase() === 'transformation') return 'default';
    return 'outline';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Choose Your Relationship Journey</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Transform your relationships with AI-powered coaching and guidance
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm ${!isYearly ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-primary"
          />
          <span className={`text-sm ${isYearly ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            Yearly
          </span>
          {isYearly && (
            <Badge variant="secondary" className="ml-2">
              Save up to 20%
            </Badge>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((plan) => {
          const basePrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const originalPrice = isYearly ? plan.monthlyPrice * 12 : undefined;
          const appliedPromo = appliedPromos[plan.tier];
          const finalPrice = appliedPromo?.isValid ? appliedPromo.finalPrice! : basePrice;
          
          return (
            <Card 
              key={plan.tier} 
              className={`relative transition-all duration-200 ${
                plan.popular ? 'border-primary shadow-lg scale-105' : 'hover:border-primary/50'
              } ${isCurrentPlan(plan.tier) ? 'bg-primary/5 border-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {isCurrentPlan(plan.tier) && showCurrentPlan && (
                <div className="absolute -top-4 right-4">
                  <Badge variant="secondary">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.tier)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  {plan.tier === 'Explorer' ? (
                    <div className="text-3xl font-bold">Free</div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-3xl font-bold">
                        {appliedPromo?.isValid && (
                          <span className="text-lg line-through text-muted-foreground mr-2">
                            {formatPrice(basePrice)}
                          </span>
                        )}
                        {formatPrice(finalPrice)}
                        <span className="text-base font-normal text-muted-foreground">
                          /{isYearly ? 'year' : 'month'}
                        </span>
                      </div>
                      {appliedPromo?.isValid && (
                        <div className="text-sm text-green-600 font-medium">
                          Save {formatPrice(basePrice - finalPrice)} with promo code
                        </div>
                      )}
                      {isYearly && originalPrice && !appliedPromo?.isValid && (
                        <div className="text-sm text-muted-foreground">
                          <span className="line-through">{formatPrice(originalPrice)}/year</span>
                          <span className="ml-2 text-green-600 font-medium">
                            Save {formatPrice(originalPrice - basePrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {plan.tier !== 'Explorer' && (
                  <PromoCodeInput
                    planTier={plan.tier as 'Growth' | 'Transformation'}
                    originalPrice={basePrice}
                    onPromoApplied={(validation) => handlePromoApplied(plan.tier, validation)}
                    onPromoRemoved={() => handlePromoRemoved(plan.tier)}
                  />
                )}

                <Button
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={loadingPlan === plan.tier.toLowerCase() || isCurrentPlan(plan.tier)}
                  variant={getButtonVariant(plan.tier) as any}
                  className="w-full"
                  size="lg"
                >
                  {getButtonText(plan.tier)}
                </Button>

                <div className="space-y-3 mt-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.limits && (
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <div className="text-sm text-muted-foreground space-y-1">
                      {plan.limits.aiChatSessions !== 'unlimited' && (
                        <div>{plan.limits.aiChatSessions} AI chat sessions/month</div>
                      )}
                      {plan.limits.aiChatSessions === 'unlimited' && (
                        <div>Unlimited AI chat sessions</div>
                      )}
                      {plan.limits.sosSessionsPerMonth !== 'unlimited' && plan.limits.sosSessionsPerMonth > 0 && (
                        <div>{plan.limits.sosSessionsPerMonth} SOS sessions/month</div>
                      )}
                      {plan.limits.sosSessionsPerMonth === 'unlimited' && (
                        <div>Unlimited SOS sessions</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ or additional info */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          All plans include our core relationship coaching features. 
          Upgrade or downgrade anytime. Cancel within 30 days for a full refund.
        </p>
      </div>
    </div>
  );
}
