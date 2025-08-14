
"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Sparkles, Pencil, BookText, ArrowLeft, Lock, BrainCircuit, Activity, BarChart, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
// Removed direct AI import - using API route instead
import type { JournalEntry, AnalyzeJournalEntryOutput } from "@/lib/types";
import { saveJournalEntry, getJournalEntries } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

function JournalView() {
    const { user, profile, loading: authLoading, hasPermission, services } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [view, setView] = useState<'list' | 'entry'>('list');
    const [newEntryContent, setNewEntryContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isLoadingEntries, setIsLoadingEntries] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    const canAnalyze = hasPermission('journal_analysis');

    const searchParams = useSearchParams();
    const prompt = searchParams.get('prompt');

    const handleNewEntryClick = useCallback((initialContent = "") => {
        setSelectedEntry(null);
        setNewEntryContent(initialContent);
        setView('entry');
        // Clear prompt from URL
        router.replace('/journal', undefined);
    }, [router]);

    useEffect(() => {
        if (prompt && view === 'list') {
            handleNewEntryClick(prompt);
        }
    }, [prompt, view, handleNewEntryClick]);

    useEffect(() => {
        if (authLoading || !services || !user) {
            if (!authLoading) setIsLoadingEntries(false);
            return;
        };
        
        const fetchEntries = async () => {
            setIsLoadingEntries(true);
            try {
                const fetchedEntries = await getJournalEntries(services.firestore, user.uid);
                setEntries(fetchedEntries);
            } catch (error) {
                console.error("Failed to fetch journal entries:", error);
            } finally {
                setIsLoadingEntries(false);
            }
        };
        fetchEntries();
    }, [user, authLoading, services]);

    const handleSaveEntry = () => {
        if (!user || !profile || !services || newEntryContent.trim() === "") return;

        startTransition(async () => {
            const contentToSave = newEntryContent;
            try {
                let analysis: AnalyzeJournalEntryOutput | null = null;
                if (canAnalyze) {
                    toast({ title: "Analyzing your entry...", description: "This may take a moment." });
                    
                    // Call AI analysis API
                    const analysisResponse = await fetch('/api/ai/journal-analysis', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            journalEntry: contentToSave,
                            userProfile: profile
                        }),
                    });

                    if (analysisResponse.ok) {
                        analysis = await analysisResponse.json();
                    }
                }
                
                const entryData = {
                    content: contentToSave,
                    analysis: analysis || undefined,
                };

                const newId = await saveJournalEntry(services.firestore, user.uid, entryData);
                
                const newEntry: JournalEntry = { 
                    id: newId, 
                    userId: user.uid, 
                    date: new Date(),
                    content: contentToSave,
                    analysis: analysis || undefined
                };
                
                setEntries([newEntry, ...entries]);
                setSelectedEntry(newEntry);
                setView('entry');
                toast({
                    title: canAnalyze ? "Saved & Analyzed" : "Entry Saved",
                    description: canAnalyze ? "Your journal entry has been saved with AI insights." : "Your journal entry has been saved."
                });
            } catch (error) {
                 console.error("Error saving entry:", error);
                 toast({ variant: "destructive", title: "Error", description: "Failed to save entry." });
            }
        });
    }

    const handleSelectEntry = (entry: JournalEntry) => {
        setSelectedEntry(entry);
        setView('entry');
    }

    const handleBackToList = () => {
        setView('list');
        setSelectedEntry(null);
        setNewEntryContent("");
    }

    if (authLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin"/>
            </div>
        )
    }

    if (!user) {
        return (
             <div className="flex h-full w-full items-center justify-center">
                <Card className="text-center p-8">
                    <CardHeader>
                        <CardTitle>Sign In Required</CardTitle>
                        <CardDescription>You need to be signed in to use the journal.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/auth/signin">Sign In</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (view === 'entry') {
        return (
            <div className="h-full flex flex-col">
                <header className="p-4 border-b flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleBackToList}>
                        <ArrowLeft />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold">{selectedEntry ? 'Journal Entry' : 'New Journal Entry'}</h1>
                        {selectedEntry && <p className="text-sm text-muted-foreground">{format(new Date(selectedEntry.date), "PPpp")}</p>}
                    </div>
                     {!selectedEntry && (
                         <Button onClick={handleSaveEntry} disabled={isPending || newEntryContent.trim() === ""}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {canAnalyze ? 'Save & Analyze' : 'Save Entry'}
                        </Button>
                    )}
                </header>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <main className="flex-1 p-6">
                        <Textarea
                            placeholder="What's on your mind? Reflect on your day, your feelings, your relationship..."
                            className="w-full h-full text-base resize-none border-0 focus-visible:ring-0 shadow-none p-0 bg-transparent"
                            value={selectedEntry ? selectedEntry.content : newEntryContent}
                            onChange={(e) => setNewEntryContent(e.target.value)}
                            readOnly={!!selectedEntry}
                        />
                    </main>
                    {selectedEntry && (
                        <aside className="w-full md:w-96 border-t md:border-t-0 md:border-l bg-muted/30">
                            <ScrollArea className="h-full">
                                <div className="p-6">
                                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                        <Sparkles className="text-primary"/>
                                        AI Analysis
                                    </h2>
                                    {isPending ? (
                                        <div className="flex items-center justify-center h-48">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : selectedEntry.analysis ? (
                                        <div className="space-y-4">
                                            <AnalysisSection analysis={selectedEntry.analysis} />
                                        </div>
                                    ) : !canAnalyze ? (
                                        <Card className="text-center">
                                            <CardHeader>
                                                <CardTitle className="flex items-center justify-center gap-2"><Lock className="w-4 h-4"/> AI Analysis Locked</CardTitle>
                                                <CardDescription>Upgrade to the Growth plan to unlock AI-powered insights for your journal.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Button asChild>
                                                    <Link href="/profile">Upgrade Plan</Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">This entry has not been analyzed.</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </aside>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative">
            <header className="p-4 border-b">
                 <h1 className="text-xl font-bold flex items-center gap-2"><BookText className="w-6 h-6"/> My Journal</h1>
                 <p className="text-sm text-muted-foreground">Your private space for reflection and growth.</p>
            </header>
            <ScrollArea className="flex-1">
                {isLoadingEntries ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center p-8">
                        <p className="text-muted-foreground">No journal entries yet.</p>
                        <Button onClick={() => handleNewEntryClick()} className="mt-4">
                            <Pencil className="mr-2 h-4 w-4" />
                            Write Your First Entry
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {entries.map((entry) => (
                             <Card key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelectEntry(entry)}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{format(new Date(entry.date), "PPP")}</CardTitle>
                                        <CardDescription>{format(new Date(entry.date), "p")}</CardDescription>
                                    </div>
                                    {entry.analysis && <Sparkles className="w-5 h-5 text-primary" />}
                                </CardHeader>
                                <CardContent>
                                    <p className="line-clamp-2 text-sm text-muted-foreground">{entry.content}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
            <Button
                onClick={() => handleNewEntryClick()}
                className="absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
                size="icon"
            >
                <Pencil className="h-6 w-6" />
                <span className="sr-only">New Journal Entry</span>
            </Button>
        </div>
    );
}

export function JournalUI() {
    return (
        <React.Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <JournalView />
        </React.Suspense>
    )
}

function AnalysisSection({ analysis }: { analysis: AnalyzeJournalEntryOutput }) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Activity /> Emotional Tone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Primary Tone</span>
                        <Badge variant="secondary">{analysis.emotionalTone.primary}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                         <span className="text-muted-foreground">Intensity</span>
                        <span>{analysis.emotionalTone.intensity} / 10</span>
                    </div>
                    <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Detected Emotions:</p>
                        <div className="flex flex-wrap gap-1">
                            {analysis.emotionalTone.emotions.map((emo, i) => <Badge key={i} variant="outline">{emo}</Badge>)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AnalysisCard title="Insights" icon={BrainCircuit}>
                <ul className="space-y-2">
                    {analysis.insights.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground capitalize">{item.category.replace(/-/g, ' ')}:</span> {item.insight}
                        </li>
                    ))}
                </ul>
            </AnalysisCard>

            <AnalysisCard title="Recurring Patterns" icon={BarChart}>
                 <ul className="space-y-2 list-disc list-inside">
                    {analysis.patterns.map((item, i) => <li key={i} className="text-sm text-muted-foreground">{item}</li>)}
                </ul>
            </AnalysisCard>

            <AnalysisCard title="Suggestions" icon={Pin}>
                <ul className="space-y-3">
                    {analysis.suggestions.map((item, i) => (
                        <li key={i} className="text-sm">
                            <p className="font-semibold">{item.action}</p>
                            <p className="text-muted-foreground text-xs italic">{item.reasoning}</p>
                        </li>
                    ))}
                </ul>
            </AnalysisCard>
        </div>
    )
}


function AnalysisCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType, children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Icon className="w-4 h-4"/> {title}</CardTitle>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    )
}

    
