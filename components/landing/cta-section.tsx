import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative py-20 bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-32 right-10 w-20 h-20 bg-white rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-white rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Icon */}
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Heart className="w-10 h-10 text-white" />
          </div>

          {/* Main CTA */}
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Your Dream Relationship 
            <span className="block">Is Just One Click Away</span>
          </h2>

          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Join thousands of couples who've transformed their relationships with AI-powered coaching, 
            expert guidance, and community support.
          </p>

          {/* Benefits */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 text-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>Start Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              <span>Setup Takes 2 Minutes</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <Button 
              size="lg" 
              asChild 
              className="text-xl px-12 py-6 bg-white text-rose-600 hover:bg-gray-50 shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
            >
              <Link href="/auth/signup" className="flex items-center gap-3">
                <Heart className="w-6 h-6" />
                Transform Your Relationship Today
                <ArrowRight className="w-6 h-6" />
              </Link>
            </Button>
            
            <p className="text-sm opacity-75">
              Already have an account?{" "}
              <Link href="/auth/signin" className="underline hover:no-underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-300">
                {[1,2,3,4,5].map((i) => (
                  <span key={i} className="text-lg">★</span>
                ))}
              </div>
              <span>4.9/5 from 2,500+ reviews</span>
            </div>
            <div>
              <span>🔒 Enterprise-grade security</span>
            </div>
            <div>
              <span>💝 30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-16 fill-gray-50 dark:fill-gray-900" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  );
}