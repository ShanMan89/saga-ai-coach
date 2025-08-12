import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah & Mike",
    status: "Married 8 years",
    rating: 5,
    text: "Saga AI Coach helped us communicate better than we ever thought possible. The AI insights were spot-on, and the community support was incredible during our rough patch.",
    highlight: "Better communication",
    avatar: "SM",
    gradient: "from-rose-400 to-pink-500"
  },
  {
    name: "Jessica",
    status: "Recently divorced",
    rating: 5,
    text: "After my divorce, I thought I'd never trust again. The journaling feature helped me understand my patterns, and I'm now in the healthiest relationship of my life.",
    highlight: "Self-awareness breakthrough",
    avatar: "J",
    gradient: "from-purple-400 to-pink-500"
  },
  {
    name: "Alex & Jordan",
    status: "Dating 2 years",
    rating: 5,
    text: "The SOS sessions were a lifesaver during our biggest fight. Having access to professional coaches at 2 AM literally saved our relationship.",
    highlight: "Crisis intervention",
    avatar: "AJ",
    gradient: "from-blue-400 to-cyan-500"
  },
  {
    name: "Maria",
    status: "Single",
    rating: 5,
    text: "I joined to work on myself before dating again. The AI coach helped me identify toxic patterns I never noticed. I feel so much more confident now.",
    highlight: "Personal growth",
    avatar: "M",
    gradient: "from-green-400 to-emerald-500"
  },
  {
    name: "David & Tom",
    status: "Engaged",
    rating: 5,
    text: "Planning a wedding is stressful, but Saga helped us stay connected through it all. The daily check-ins and goal setting kept us focused on what matters.",
    highlight: "Relationship goals",
    avatar: "DT",
    gradient: "from-orange-400 to-red-500"
  },
  {
    name: "Elena",
    status: "Married 15 years",
    rating: 5,
    text: "We thought we knew everything about each other after 15 years. The AI insights revealed patterns we never saw and reignited our passion.",
    highlight: "Renewed passion",
    avatar: "E",
    gradient: "from-indigo-400 to-purple-500"
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800">
            Real Stories
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Thousands of Relationships Transformed
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Hear from real couples and individuals who've found deeper connection, 
            better communication, and lasting love with Saga AI Coach.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.name} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-8 h-8 text-gray-400" />
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {testimonial.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>

                <Badge variant="secondary" className="w-fit text-xs">
                  {testimonial.highlight}
                </Badge>
              </CardHeader>

              <CardContent>
                <blockquote className="text-gray-600 dark:text-gray-300 italic leading-relaxed">
                  "{testimonial.text}"
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-rose-600 mb-2">10,000+</div>
            <div className="text-gray-600 dark:text-gray-300">Happy Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-pink-600 mb-2">4.9/5</div>
            <div className="text-gray-600 dark:text-gray-300">Average Rating</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">50,000+</div>
            <div className="text-gray-600 dark:text-gray-300">Sessions Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
            <div className="text-gray-600 dark:text-gray-300">Recommend Us</div>
          </div>
        </div>
      </div>
    </section>
  );
}