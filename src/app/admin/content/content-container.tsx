
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AudioWaveform, FilePlus, PlayCircle, Trash2, Loader2, Music4 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { getAudioTips, createAudioTip, deleteAudioTip } from "@/services/firestore";
import type { AudioTip } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";

export default function AdminContentContainer() {
    const [audioTips, setAudioTips] = useState<AudioTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [newTipTitle, setNewTipTitle] = useState("");
    const [newTipFile, setNewTipFile] = useState<File | null>(null);
    const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
    const { toast } = useToast();
    const { user, services, loading: authLoading } = useAuth();
    
    const fetchTips = async () => {
        if (!services) return;
        setLoading(true);
        try {
            const tips = await getAudioTips(services.firestore);
            setAudioTips(tips);
        } catch (error) {
            console.error("Failed to fetch audio tips:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load audio tips." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
      if(!authLoading && user && services) {
        fetchTips();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user, services]);

    const handleUploadTip = async () => {
        if (!services || newTipTitle.trim() === "" || !newTipFile) {
            toast({ variant: "destructive", title: "Error", description: "Please provide a title and select a file." });
            return;
        }

        const storage = getStorage(services.app);
        setIsUploading(true);
        try {
            const storageRef = ref(storage, `audioTips/${Date.now()}_${newTipFile.name}`);
            const snapshot = await uploadBytes(storageRef, newTipFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const audio = new Audio(downloadURL);
            audio.onloadedmetadata = async () => {
                const duration = audio.duration;
                
                const newTip: Omit<AudioTip, 'id' | 'dateAdded'> = {
                    title: newTipTitle,
                    url: downloadURL,
                    duration: duration,
                };
                
                await createAudioTip(services.firestore, newTip);
                toast({ title: "Tip Uploaded", description: `"${newTipTitle}" has been added.` });
                
                // Reset form and close dialog
                setNewTipTitle("");
                setNewTipFile(null);
                setIsUploadOpen(false);
                await fetchTips(); // Refresh list
            };
        } catch (error) {
            console.error("Upload failed:", error);
            toast({ variant: "destructive", title: "Upload Failed", description: "There was an error uploading your file." });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteTip = async (tip: AudioTip) => {
        if (!services) return;
        try {
            await deleteAudioTip(services.firestore, services.app, tip);

            toast({ title: "Tip Deleted", description: `"${tip.title}" has been removed.` });
            await fetchTips();
        } catch (error) {
            console.error("Deletion failed:", error);
            toast({ variant: "destructive", title: "Delete Failed", description: "There was an error deleting the tip." });
        }
    };

    const handlePlayAudio = (url: string) => {
        if (playingAudio) {
            playingAudio.pause();
        }
        const newAudio = new Audio(url);
        setPlayingAudio(newAudio);
        newAudio.play();
    };

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    const pageLoading = authLoading || loading;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Content Manager</h2>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <FilePlus className="mr-2 h-4 w-4" />
                            Upload New Tip
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload New Audio Tip</DialogTitle>
                            <DialogDescription>
                                Upload an audio file and provide a title. The file will be available to users.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Tip Title</Label>
                                <Input id="title" value={newTipTitle} onChange={(e) => setNewTipTitle(e.target.value)} placeholder="e.g., Active Listening" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="audio-file">Audio File (MP3)</Label>
                                <Input id="audio-file" type="file" accept=".mp3,audio/*" onChange={(e) => setNewTipFile(e.target.files ? e.target.files[0] : null)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>Cancel</Button>
                            <Button onClick={handleUploadTip} disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Music4 />
                    Manage Audio Tips
                </CardTitle>
                <CardDescription>
                    Review, play, or remove the audio tips available to users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageLoading ? (
                             Array.from({ length: 3 }).map((_, i) => (
                               <TableRow key={i}>
                                 <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                 <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                 <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                 <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                               </TableRow>
                             ))
                        ) : audioTips.length === 0 ? (
                           <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No audio tips uploaded yet.</TableCell>
                           </TableRow>
                        ) : (
                            audioTips.map((tip) => (
                                <TableRow key={tip.id}>
                                    <TableCell className="font-medium">{tip.title}</TableCell>
                                    <TableCell>{formatDuration(tip.duration)}</TableCell>
                                    <TableCell>{format(tip.dateAdded, "PP")}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="mr-2" onClick={() => handlePlayAudio(tip.url)}>
                                            <PlayCircle className="mr-2 h-4 w-4" />
                                            Play
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the audio tip from storage and the database. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteTip(tip)}>
                                                        Yes, Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </div>
      );
}
