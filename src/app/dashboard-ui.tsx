
"use client";

import Link from "next/link";
import { ArrowRight, Bot, BookText, Users, Feather, MessageSquareHeart, Zap } from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect } from "react";
import type { JournalEntry, Message, Post } from "@/lib/types";
import { getChatHistory, getJournalEntries, getCommunityPosts } from "@/services/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";


export function DashboardUI() {
  const { user, profile, loading, services } = useAuth();
  const [lastAiMessage, setLastAiMessage] = useState<string | null>(null);
  const [lastJournal, setLastJournal] = useState<JournalEntry | null>(null);
  const [greeting, setGreeting] = useState("Welcome back");
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [latestCommunityTopic, setLatestCommunityTopic] = useState<string>("General");

  const todaysPrompt = "What is one thing you appreciate about your partner today?";

  useEffect(() => {
    async function fetchDashboardData() {
        if (!user || !services) {
          setDashboardLoading(false);
          return;
        };

        setDashboardLoading(true);
        try {
            const [messages, journals, posts] = await Promise.all([
               getChatHistory(services.firestore, user.uid, 5),
               getJournalEntries(services.firestore, user.uid, 1),
               getCommunityPosts(services.firestore, { limit: 1 })
            ]);
            
            const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
            setLastAiMessage(lastAssistantMessage?.content || "Hello! How can I help you today?");

            if (journals.length > 0) {
              setLastJournal(journals[0]);
            }

            if (posts.length > 0) {
              setLatestCommunityTopic(posts[0].topic);
            }

        } catch (error) {
            console.error("Failed to fetch dashboard data from Firestore", error);
        } finally {
            setDashboardLoading(false);
        }
    }
    
    if (!loading && user && services) {
      fetchDashboardData();
    } else if (!loading && !user) {
      setDashboardLoading(false);
    }
  }, [user, loading, services]);

  useEffect(() => {
    if (loading || !profile) return;
    const hour = new Date().getHours();
    const name = profile?.name?.split(' ')[0] || 'Saga User';
    if (hour < 12) setGreeting(`Good morning, ${name}`);
    else if (hour < 18) setGreeting(`Good afternoon, ${name}`);
    else setGreeting(`Good evening, ${name}`);
  }, [profile, loading]);
  
  const pageLoading = loading || (dashboardLoading && !!user);

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
    <div className="flex items-center justify-between space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">
        {pageLoading ? <Skeleton className="h-9 w-64" /> : greeting}
      </h1>
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Continue Your Conversation
          </CardTitle>
          <CardDescription>
            Your AI coach, Sage, is here to help you.
          </CardDescription>
        </CardHeader>
        <CardContent>
         {pageLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
             <p className="text-sm text-muted-foreground italic line-clamp-2">
              {lastAiMessage || "Start a conversation with your AI coach."}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/chat">
              Chat with Sage <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Feather className="h-6 w-6" />
            Today's Focus
          </CardTitle>
          <CardDescription>A prompt for your reflection.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">
            {todaysPrompt}
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href={`/journal?prompt=${encodeURIComponent(todaysPrompt)}`}>
              Write in Journal
            </Link>
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookText className="h-6 w-6" />
            Recent Journal
          </CardTitle>
           <CardDescription>Your last entry and its analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {pageLoading ? (
             <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
             </div>
          ) : lastJournal ? (
            <>
              <p className="text-sm font-medium truncate">
                {lastJournal.content}
              </p>
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold">Sentiment:</span> {lastJournal.analysis?.emotionalTone.primary || 'N/A'}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No recent journal entries.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/journal">
              View Journals
            </Link>
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Community Highlights
          </CardTitle>
          <CardDescription>
            Connect with others on a similar journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
         {pageLoading ? <Skeleton className="h-5 w-48" /> : (
          <p className="text-sm text-muted-foreground">
            Discussions on <span className="font-semibold text-primary">{`${latestCommunityTopic}`}</span> are trending.
          </p>
         )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/community">
              Join the Conversation
            </Link>
          </Button>
        </CardFooter>
      </Card>
       <Card className="relative overflow-hidden">
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <MessageSquareHeart className="h-6 w-6" />
                SOS Sessions
            </CardTitle>
            <CardDescription>Book a one-on-one session when you need it most.</CardDescription>
         </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Get expert guidance from a real coach.</p>
        </CardContent>
         <CardFooter>
            <Button asChild>
              <Link href="/sos">
                Book a Session <Zap className="ml-2 h-4 w-4" />
              </Link>
            </Button>
         </CardFooter>
      </Card>
    </div>
  </div>
  );
}
