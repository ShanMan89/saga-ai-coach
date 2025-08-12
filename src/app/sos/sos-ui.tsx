
"use client";

import { bookSOSSession } from "@/ai/flows/book-sos-session";
import { getAvailability } from "@/services/firestore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquareHeart, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";


export function SOSUI() {
  const { user, profile, loading: authLoading, services } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAvailability() {
      if (!services) return;
      setLoadingSlots(true);
      try {
        const slots = await getAvailability(services.firestore);
        setAvailableSlots(slots);
      } catch (error) {
        console.error("Failed to fetch availability", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch available time slots.",
        });
      } finally {
        setLoadingSlots(false);
      }
    }
    
    if (!authLoading && services) {
        fetchAvailability();
    }
  }, [toast, authLoading, services]);

  const handleBookSession = async () => {
    if (!selectedSlot || !user || !profile) return;

    setIsBooking(true);
    const { id } = toast({
      title: "Booking your session...",
      description: "Please wait a moment.",
    });

    try {
      const result = await bookSOSSession({ slot: selectedSlot, userProfile: profile });
      toast({
        id,
        title: result.success ? "SOS Session Booked!" : "Booking Failed",
        description: result.confirmationMessage,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        setAvailableSlots((prev) => prev.filter((s) => s !== selectedSlot));
        setSelectedSlot(null);
      }
    } catch (error) {
        console.error("Error booking session:", error);
        toast({
            id,
            variant: "destructive",
            title: "Booking Error",
            description: "An unexpected error occurred. Please try again."
        })
    } finally {
      setIsBooking(false);
    }
  };
  
  const formatSlot = (isoString: string) => {
    return format(new Date(isoString), "EEEE, MMMM d 'at' h:mm a");
  };
  
  const renderContent = () => {
      if (authLoading || loadingSlots) {
           return (
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
           );
      }
      
      if (!user) {
          return (
             <div className="text-center p-4 rounded-md bg-muted text-muted-foreground flex flex-col items-center justify-center gap-4">
                <AlertTriangle className="w-8 h-8 text-primary" />
                <p>Please sign in to book an SOS session.</p>
                <Button asChild>
                    <Link href="/auth/signin">Sign In</Link>
                </Button>
            </div>
          )
      }

      if (availableSlots.length > 0) {
          return (
             <Select onValueChange={setSelectedSlot} value={selectedSlot || ""} disabled={isBooking}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an available time slot" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatSlot(slot)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          )
      }
      
      return (
         <div className="text-center p-4 rounded-md bg-muted text-muted-foreground flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <p>No available sessions at the moment. Please check back later.</p>
        </div>
      )
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
    <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquareHeart className="w-8 h-8"/>
            Book an SOS Session
        </h1>
        <p className="text-muted-foreground mt-2">
            Need to talk to someone urgently? Select an available time slot below to book a one-on-one session with a coach.
        </p>
    </header>

    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Select a Time</CardTitle>
        <CardDescription>
          Choose a time that works for you. All times are shown in your local timezone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleBookSession}
          disabled={!selectedSlot || isBooking || loadingSlots || !user}
        >
          {isBooking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Booking...
            </>
          ) : (
            "Confirm & Book Session"
          )}
        </Button>
      </CardFooter>
    </Card>
  </div>
  );
}
