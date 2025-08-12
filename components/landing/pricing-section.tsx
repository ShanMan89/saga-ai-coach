"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useState } from "react";
import { Check, Heart, Sparkles, Crown, Zap } from "lucide-react";
import { PRICING_PLANS, formatPrice } from "@/lib/pricing";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const getIcon = (tier: string) => {
    switch (tier) {
      case 'Explorer': return Heart;
      case 'Growth': return Sparkles;
      case 'Transformation': return Crown;
      default: return Heart;
    }
  };

  const getGradient = (tier: string) => {
    switch (tier) {
      case 'Explorer': return 'from-gray-500 to-gray-600';
      case 'Growth': return 'from-rose-500 to-pink-600';
      case 'Transformation': return 'from-purple-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <section id="pricing" className="py-20 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Relationship Journey
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Start free and upgrade as your relationship grows. 
            All plans include our core AI coaching and community support.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm ${!isYearly ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-sm ${isYearly ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              Yearly
            </span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                Save up to 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {PRICING_PLANS.map((plan) => {
            const IconComponent = getIcon(plan.tier);
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const originalYearlyPrice = plan.monthlyPrice * 12;
            
            return (
              <Card 
                key={plan.tier}
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  plan.popular 
                    ? 'ring-2 ring-purple-500 shadow-lg transform scale-105' 
                    : 'hover:ring-1 hover:ring-purple-200'
                } ${plan.tier === 'Explorer' ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-3 py-1 text-sm font-medium">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full bg-gradient-to-r ${getGradient(plan.tier)} text-white`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
                    {plan.description}
                  </CardDescription>

                  <div className="mt-6">
                    {plan.tier === 'Explorer' ? (
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        Free
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(price)}
                          <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                            /{isYearly ? 'year' : 'month'}
                          </span>
                        </div>
                        {isYearly && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="line-through">{formatPrice(originalYearlyPrice)}/year</span>
                            <span className="ml-2 text-green-600 font-medium">
                              Save {formatPrice(originalYearlyPrice - price)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <Link href="/auth/signup" className="block mb-6">
                    <Button 
                      className={`w-full text-lg py-6 ${
                        plan.popular 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : plan.tier === 'Explorer'
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                      }`}
                    >
                      {plan.tier === 'Explorer' ? 'Get Started Free' : `Start ${plan.name}`}
                    </Button>
                  </Link>

                  <div className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Usage Limits */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>
                        {plan.limits.aiChatSessions === 'unlimited' 
                          ? 'Unlimited AI conversations' 
                          : `${plan.limits.aiChatSessions} AI conversations/month`
                        }
                      </div>
                      {(typeof plan.limits.sosSessionsPerMonth === 'number' && plan.limits.sosSessionsPerMonth > 0) || plan.limits.sosSessionsPerMonth === 'unlimited' && (
                        <div>
                          {plan.limits.sosSessionsPerMonth === 'unlimited' 
                            ? 'Unlimited SOS sessions' 
                            : `${plan.limits.sosSessionsPerMonth} SOS sessions/month`
                          }
                        </div>
                      )}
                      {plan.limits.videoCoachingSessions > 0 && (
                        <div>{plan.limits.videoCoachingSessions} video sessions/month</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ/Additional Info */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Can I change plans anytime?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Yes, you can upgrade, downgrade, or cancel your subscription at any time from your account settings.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  What's included in SOS sessions?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  SOS sessions provide immediate AI support during relationship emergencies, with personalized guidance and coping strategies.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Is there a money-back guarantee?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Yes, we offer a 30-day money-back guarantee if you're not completely satisfied.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  How do video coaching sessions work?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Video sessions connect you with certified relationship coaches for personalized, one-on-one guidance tailored to your specific situation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}