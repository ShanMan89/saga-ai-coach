
"use client";

import AppLayout from "@/components/layout/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, Bot, BookText, Users, MessageSquarePlus, Zap, CreditCard, Percent, BarChart, Sparkles, CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, SubscriptionTierType } from "@/lib/types";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { updateUserProfile } from "@/services/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { createCheckoutSession } from "@/ai/flows/stripe";
import { loadStripe } from '@stripe/stripe-js';

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function ProfileUI() {
  const { user, profile, loading, services, refreshProfile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({ name: profile.name });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !services) return;
    try {
      await updateUserProfile(services.firestore, user.uid, { name: data.name });
      await refreshProfile();
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    }
  };
  
  if (loading || !profile || !services) {
    return (
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
    <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Manage your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar} data-ai-hint="person" />
                <AvatarFallback>{profile.name?.charAt(0) || 'S'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {profile.email}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Appointments</CardTitle>
            <CardDescription>
              Review your upcoming and past SOS sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Feature coming soon.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>
                <div className="flex items-center justify-between">
                    <span>Your Subscription</span>
                    <Badge variant="secondary" className="capitalize">{profile.role === 'admin' ? profile.role : profile.subscriptionTier}</Badge>
                </div>
            </CardTitle>
            <CardDescription>Manage your subscription plan and billing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <SubscriptionTier
                title="Explorer"
                price="Free"
                features={[
                    {icon: Bot, text: "Limited AI Chat (10/day)"},
                    {icon: BookText, text: "Basic Journaling"},
                    {icon: Users, text: "Read-only Community"},
                ]}
                currentTier={profile.subscriptionTier}
             />
             <SubscriptionTier
                title="Growth"
                price="$14.99/mo"
                features={[
                    {icon: Bot, text: "Unlimited AI Chat"},
                    {icon: BookText, text: "Intelligent Journaling"},
                    {icon: Users, text: "Full Community Access"},
                    {icon: MessageSquarePlus, text: "Interactive AI Scenarios"},
                ]}
                currentTier={profile.subscriptionTier}
                onUpgrade={() => {}}
             />
             <SubscriptionTier
                title="Transformation"
                price="$39.99/mo"
                features={[
                    {icon: Zap, text: "All Growth features"},
                    {icon: Sparkles, text: "AI Session Prep & Debrief"},
                    {icon: BarChart, text: "Proactive AI Insights"},
                    {icon: CalendarClock, text: "Priority Booking"},
                    {icon: Percent, text: "10% Discount on SOS Sessions"},
                ]}
                currentTier={profile.subscriptionTier}
                onUpgrade={() => {}}
             />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}

interface SubscriptionTierProps {
    title: SubscriptionTierType;
    price: string;
    features: {icon: React.ElementType, text: string}[];
    onUpgrade?: (tier: "Growth" | "Transformation") => void;
    currentTier: SubscriptionTierType | 'admin';
}

function SubscriptionTier({ title, price, features, onUpgrade, currentTier }: SubscriptionTierProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const isCurrent = currentTier === title;
    const tierLevels: Record<SubscriptionTierType | 'admin', number> = { "Explorer": 1, "Growth": 2, "Transformation": 3, "admin": 99 };
    const isDowngrade = tierLevels[currentTier] > tierLevels[title];
    const canUpgrade = !isCurrent && !isDowngrade && onUpgrade;

    const handleButtonClick = () => {
        if (!canUpgrade || title === "Explorer" || !onUpgrade) return;
        setIsProcessing(true);
        onUpgrade(title);
    };
    
    let buttonText = `Upgrade to ${title}`;
    if (isCurrent) buttonText = "Current Plan";
    if (isDowngrade) buttonText = "Manage Subscription";

    return (
        <Card className="bg-muted/30">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <p className="font-bold text-lg">{price}</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                            <feature.icon className="h-4 w-4 text-primary" />
                            <span>{feature.text}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            {onUpgrade && <CardFooter>
                 <Button className="w-full" disabled={!canUpgrade || isProcessing} onClick={handleButtonClick}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isProcessing ? "Redirecting..." : buttonText}
                 </Button>
            </CardFooter>}
        </Card>
    )
}
