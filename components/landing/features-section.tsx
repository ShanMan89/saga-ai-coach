import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, BookText, Users, MessageSquareHeart, Brain, Shield, Heart, Zap } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "24/7 AI Coach",
    description: "Get instant, personalized relationship advice powered by advanced AI. Always available when you need guidance most.",
    gradient: "from-blue-500 to-cyan-500",
    benefits: ["Instant responses", "Personalized advice", "Always available"]
  },
  {
    icon: BookText,
    title: "Smart Journaling",
    description: "Reflect on your experiences with AI-powered insights that help you understand patterns and track your growth.",
    gradient: "from-green-500 to-emerald-500",
    benefits: ["Pattern recognition", "Growth tracking", "Deep insights"]
  },
  {
    icon: Users,
    title: "Anonymous Community",
    description: "Connect with others on similar journeys in a safe, supportive environment where you can share and learn.",
    gradient: "from-purple-500 to-pink-500",
    benefits: ["Safe space", "Peer support", "Shared experiences"]
  },
  {
    icon: MessageSquareHeart,
    title: "Expert SOS Sessions",
    description: "Book emergency sessions with certified relationship coaches when you need immediate professional support.",
    gradient: "from-rose-500 to-pink-500",
    benefits: ["Certified coaches", "Emergency support", "Professional guidance"]
  },
  {
    icon: Brain,
    title: "Personalized Insights",
    description: "Receive tailored recommendations and insights based on your unique relationship patterns and goals.",
    gradient: "from-indigo-500 to-purple-500",
    benefits: ["Custom recommendations", "Pattern analysis", "Goal-focused"]
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your personal information is protected with enterprise-grade security. Share safely and anonymously.",
    gradient: "from-gray-500 to-slate-600",
    benefits: ["End-to-end encryption", "Anonymous sharing", "GDPR compliant"]
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Transform Your Relationships
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our comprehensive platform combines AI technology, expert guidance, and community support 
            to give you the tools for lasting relationship success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                
                <CardHeader className="relative">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative">
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Heart className="w-3 h-3 text-rose-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 rounded-2xl border border-rose-200 dark:border-rose-800">
            <Zap className="w-8 h-8 text-rose-500" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Ready to get started?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Join thousands of couples already transforming their relationships.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}