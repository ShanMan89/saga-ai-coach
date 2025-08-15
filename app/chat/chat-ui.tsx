// src/app/chat/chat-ui.tsx
"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Bot, Send, User, Clock, Loader2, Sparkles, Lock } from "lucide-react";
// Removed direct AI imports - using API routes instead
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Message, UserProfile } from "@/lib/types";
import { getChatHistory, saveChatMessage } from "@/services/firestore";
import { format } from "date-fns";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export function ChatUI() {
  const { user, profile, loading, services, refreshProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const limitReached = profile?.subscriptionTier === "Explorer" && (profile.messageCount || 0) >= 10;

  useEffect(() => {
    if (loading || !services || !profile || !user) {
        if (!loading && !user) {
            setIsLoadingHistory(false);
        }
        return;
    };
    
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const history = await getChatHistory(services.firestore, user.uid);
        if (history.length === 0) {
          setMessages([
            {
              role: "assistant",
              content: `Hello ${profile?.name?.split(' ')[0] || ''}! I'm Sage, your personal relationship coach. What's on your mind today?`,
            }
          ]);
        } else {
          setMessages(history);
        }
      } catch (error: any) {
        console.error("Error fetching chat history:", error);
        toast({
          title: "Error loading chat history",
          description: error?.message || "Could not load previous messages. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
          setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user, loading, profile, services, toast]);

  const handleSendMessage = () => {
    if (!user || !services || !profile || input.trim() === "" || limitReached) return;

    const userMessage: Message = { role: "user", content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");

    startTransition(async () => {
        try {
          await saveChatMessage(services.firestore, user.uid, userMessage);
          await refreshProfile();
          
          const historyForAi = currentMessages.slice(-10);

          // Get auth token
          const token = await user.getIdToken();
          
          // Call AI chat API
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: input,
              userProfile: profile,
              previousMessages: historyForAi
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `AI service error: ${response.status}`);
          }

          const result = await response.json();
          const assistantMessage: Message = {
            role: "assistant",
            content: result.response,
            suggestions: result,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          await saveChatMessage(services.firestore, user.uid, assistantMessage);
        } catch (error: any) {
          console.error("Error in chat transition:", error);
          const errorMessage: Message = { role: "assistant", content: "Sorry, I encountered an error. Please try again." };
          setMessages((prev) => [...prev, errorMessage]);
          toast({
            title: "Error sending message",
            description: error.message,
            variant: "destructive",
          });
        }
      });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  /* SOS BOOKING DISABLED
  const handleBookSession = async (slot: string) => {
    if (!user || !profile) return;

    const loadingToast = toast({
      title: "Booking your session...",
      description: "Please wait a moment.",
      duration: 120000, // 2 minutes
    });

    try {
      // Get auth token
      const token = await user.getIdToken();
      
      const response = await fetch('/api/ai/book-sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          slot,
          userProfile: profile
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to book SOS session');
      }

      const result = await response.json();
      loadingToast.dismiss();
      toast({
        title: result.success ? "SOS Session Booked!" : "Booking Failed",
        description: result.confirmationMessage,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error("Error booking session:", error);
      loadingToast.dismiss();
      toast({
        title: "Error booking session",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  */

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatSlot = (isoString: string) => {
    return format(new Date(isoString), "EEE, MMM d 'at' h:mm a");
  };

  const renderContent = () => {
      if (loading || isLoadingHistory) {
          return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          );
      }

      if (!user) {
          return (
            <div className="flex items-center justify-center h-full">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Sign In Required</CardTitle>
                  <CardDescription>Please sign in to access the AI chat.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
      }
      
      return (
          <>
            {messages.map((message, index) => (
            <div
                key={index}
                className={cn(
                "flex items-start gap-3",
                message.role === "user" ? "justify-end" : ""
                )}
            >
                {message.role === "assistant" && (
                <Avatar className="w-8 h-8">
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                )}
                <div
                className={cn(
                    "rounded-lg p-3 max-w-lg",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
                >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {/* SOS BOOKING TEMPORARILY DISABLED
                {message.suggestions?.suggestSOSText && message.suggestions.availableSlots && message.suggestions.availableSlots.length > 0 && (
                    <SOSBookingCard
                    slots={message.suggestions.availableSlots}
                    onBook={handleBookSession}
                    formatSlot={formatSlot}
                    />
                )}
                */}
                {message.suggestions?.suggestSOSText && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            📱 SOS sessions are temporarily unavailable while we improve the experience. Check back soon!
                        </p>
                    </div>
                )}
                </div>
                {message.role === "user" && (
                <Avatar className="w-8 h-8">
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                )}
            </div>
            ))}
            {isPending && (
            <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sage is typing...</span>
                </div>
                </div>
            </div>
            )}
         </>
      )
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">Saga AI Coach</h1>
        <p className="text-sm text-muted-foreground">Your personal relationship guide, Sage.</p>
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
            {renderContent()}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        {user && (
          limitReached ? (
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2"><Lock className="w-5 h-5" /> Daily Limit Reached</CardTitle>
                <CardDescription>You&apos;ve used all your free messages for today.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Upgrade to the Growth plan for unlimited AI chat and more.</p>
                <Button asChild>
                  <Link href="/profile">Upgrade Plan</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask Sage for guidance..."
                  disabled={loading || isPending || limitReached || !services}
                  className="min-h-[40px] max-h-40 resize-y"
                  rows={1}
                />
                <Button onClick={handleSendMessage} disabled={loading || isPending || !input.trim() || limitReached || !services} size="icon" className="h-10 w-10 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {profile?.subscriptionTier === "Explorer" && (
                <div className="text-xs text-muted-foreground mt-2 text-right">
                  {profile.messageCount || 0} / 10 messages used
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

/* SOS BOOKING CARD DISABLED
function SOSBookingCard({ slots, onBook, formatSlot }: { slots: string[], onBook: (slot: string) => Promise<void>, formatSlot: (slot: string) => string }) {
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>();
  const [isBooking, setIsBooking] = useState(false);

  const handleBooking = async () => {
    if (selectedSlot) {
      setIsBooking(true);
      await onBook(selectedSlot);
      setIsBooking(false);
    }
  };

  return (
    <Card className="mt-4 bg-background/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-primary" />
          Book an SOS Session?
        </CardTitle>
        <CardDescription>
          It sounds like a one-on-one session could be helpful. Here are some
          available times:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select onValueChange={setSelectedSlot} value={selectedSlot} disabled={isBooking}>
          <SelectTrigger>
            <SelectValue placeholder="Select a time slot" />
          </SelectTrigger>
          <SelectContent>
            {slots.map((slot) => (
              <SelectItem key={slot} value={slot}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatSlot(slot)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleBooking} disabled={!selectedSlot || isBooking}>
          {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isBooking ? "Booking..." : "Confirm & Book Session"}
        </Button>
      </CardFooter>
    </Card>
  );
}
*/
