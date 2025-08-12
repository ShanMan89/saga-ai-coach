
"use client";

import AppLayout from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Users, Lock, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Post, Comment } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import Link from "next/link";
import { getCommunityPosts, createCommunityPost, togglePostLike, addCommentToPost } from "@/services/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

const topics = ["All Posts", "Communication", "Conflict", "Intimacy", "Growth", "General"];

export function CommunityUI() {
    const { user, profile, loading: authLoading, services, hasPermission } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [newPostContent, setNewPostContent] = useState("");
    const [activeTopic, setActiveTopic] = useState("All Posts");
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
    const [newComment, setNewComment] = useState("");
    const { toast } = useToast();
    const [isPosting, startPostingTransition] = useTransition();

    const canPost = hasPermission('community_write');

    useEffect(() => {
        if (authLoading || !services) {
            if (!authLoading) setLoadingPosts(false);
            return;
        };
        
        const fetchPosts = async () => {
            setLoadingPosts(true);
            try {
                const fetchedPosts = await getCommunityPosts(services.firestore);
                setPosts(fetchedPosts);
            } catch (error) {
                console.error("Failed to fetch posts:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load community posts." });
            } finally {
                setLoadingPosts(false);
            }
        };
        fetchPosts();
    }, [authLoading, services, toast]);

    const handlePost = () => {
        if (!user || !profile || !services || newPostContent.trim() === "" || !canPost) return;

        startPostingTransition(async () => {
            try {
                const postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'comments'> = {
                    authorId: user.uid,
                    author: `Anonymous User`, // Anonymized for privacy
                    avatar: `https://placehold.co/40x40.png?text=A`, // Generic avatar
                    content: newPostContent,
                    topic: activeTopic !== "All Posts" ? activeTopic : "General",
                };
                const newPost = await createCommunityPost(services.firestore, postData);
                setPosts(prev => [newPost, ...prev]);
                setNewPostContent("");
                toast({ title: "Posted!", description: "Your thoughts have been shared." });
            } catch (error) {
                 console.error("Failed to create post:", error);
                 toast({ variant: "destructive", title: "Error", description: "Could not share your post." });
            }
        });
    };

    const handleLike = async (id: string) => {
        if (!user || !services) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be signed in to like a post." });
            return;
        }

        const originalPosts = [...posts];
        
        const updatedPosts = posts.map(post => {
            if (post.id === id) {
                const alreadyLiked = post.likedBy.includes(user.uid);
                return { 
                    ...post, 
                    likes: alreadyLiked ? post.likes - 1 : post.likes + 1, 
                    likedBy: alreadyLiked ? post.likedBy.filter(uid => uid !== user.uid) : [...post.likedBy, user.uid]
                };
            }
            return post;
        });
        setPosts(updatedPosts);

        try {
            await togglePostLike(services.firestore, id, user.uid);
        } catch (error) {
            setPosts(originalPosts);
            console.error("Failed to update like:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not update like." });
        }
    };

    const handleCommentClick = (post: Post) => {
        setSelectedPost(post);
        setIsCommentSheetOpen(true);
    };
    
    const handleAddComment = async () => {
        if (!selectedPost || !user || !profile || !services || newComment.trim() === "" || !canPost) return;
        
        const commentData: Omit<Comment, 'id' | 'createdAt'> = {
            authorId: user.uid,
            author: "Anonymous User",
            avatar: `https://placehold.co/40x40.png?text=A`, // Generic avatar
            content: newComment.trim(),
        };

        try {
            const addedComment = await addCommentToPost(services.firestore, selectedPost.id, commentData);
            
            const updatePostState = (prev: Post[]) => prev.map(p => {
                if (p.id === selectedPost.id) {
                    return {...p, comments: [...(p.comments || []), addedComment]};
                }
                return p;
            });
            
            setPosts(updatePostState);
            setSelectedPost(prev => prev ? {...prev, comments: [...(prev.comments || []), addedComment]} : null);
            setNewComment("");
        } catch(error) {
            console.error("Failed to add comment:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not add your comment." });
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handlePost();
      }
    };
    
    const filteredPosts = posts.filter(post => 
      activeTopic === "All Posts" || post.topic === activeTopic
    );

  if (authLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin"/>
        </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
    <header className="border-b p-4">
        <h1 className="text-xl font-bold flex items-center gap-2"><Users className="w-6 h-6"/> Community Feed</h1>
        <p className="text-sm text-muted-foreground">Share experiences and connect with others.</p>
    </header>

    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <main className="flex-1 flex flex-col">
             <div className="p-4 border-b">
                <Card>
                     {!user ? (
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" /> Sign In Required</CardTitle>
                            <CardDescription>You need to be signed in to participate in the community.</CardDescription>
                            <Button asChild className="mt-2 w-fit">
                                <Link href="/auth/signin">Sign In</Link>
                            </Button>
                        </CardHeader>
                     ) : canPost ? (
                        <>
                            <CardHeader className="pb-2">
                            <CardTitle className="text-base">Share your thoughts</CardTitle>
                            <CardDescription>What&apos;s on your mind? Your post will be anonymous.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end gap-2">
                                    <Textarea 
                                        placeholder="Share your experience or ask a question..." 
                                        className="min-h-[40px]"
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        disabled={isPosting}
                                    />
                                    <Button size="icon" className="h-10 w-10 shrink-0" onClick={handlePost} disabled={!newPostContent.trim() || isPosting}>
                                        {isPosting ? <Loader2 className="animate-spin" /> : <Send />}
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                     ) : (
                         <CardHeader>
                             <CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" /> Community Access</CardTitle>
                             <CardDescription>Full community access, including posting and replying, is available on the Growth plan.</CardDescription>
                             <Button asChild className="mt-2 w-fit">
                                <Link href="/profile">Upgrade to Post</Link>
                             </Button>
                         </CardHeader>
                     )}
                </Card>
            </div>
            <ScrollArea className="flex-1 p-4">
                {loadingPosts ? (
                     <div className="space-y-4">
                         <Skeleton className="h-32 w-full" />
                         <Skeleton className="h-32 w-full" />
                         <Skeleton className="h-32 w-full" />
                     </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        <p>No posts in this topic yet.</p>
                        <p>Be the first to share!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                    {filteredPosts.map((post) => (
                        <Card key={post.id} className="overflow-hidden">
                            <CardHeader className="p-4">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={post.avatar} data-ai-hint="person abstract" />
                                        <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{post.author}</p>
                                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{post.topic}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                            </CardContent>
                            <div className="flex justify-start gap-4 border-t px-4 py-2">
                                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground" onClick={() => handleLike(post.id)} disabled={!user}>
                                    <Heart className={cn("w-4 h-4", user && post.likedBy.includes(user.uid) && "text-red-500 fill-current")} />
                                    <span>{post.likes}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground" onClick={() => handleCommentClick(post)}>
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{post.comments?.length || 0}</span>
                                </Button>
                            </div>
                        </Card>
                    ))}
                    </div>
                )}
            </ScrollArea>
        </main>
        <aside className="w-full md:w-72 border-t md:border-t-0 md:border-l">
            <div className="p-4">
                <h3 className="font-semibold mb-2">Topics</h3>
                <div className="flex flex-wrap md:flex-col gap-2">
                   {topics.map(topic => (
                     <Button 
                        key={topic} 
                        variant={topic === activeTopic ? 'secondary' : 'ghost'} 
                        className="justify-start"
                        onClick={() => setActiveTopic(topic)}
                     >
                        {topic}
                    </Button>
                   ))}
                </div>
            </div>
            <Separator className="my-2"/>
             <div className="p-4">
                <h3 className="font-semibold mb-2">Community Guidelines</h3>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                    <li>Be respectful and supportive.</li>
                    <li>Maintain confidentiality.</li>
                    <li>No hate speech or bullying.</li>
                    <li>Share from your own experience.</li>
                </ul>
            </div>
        </aside>
    </div>
   <Sheet open={isCommentSheetOpen} onOpenChange={setIsCommentSheetOpen}>
    <SheetContent className="flex flex-col">
      <SheetHeader className="text-left">
        <SheetTitle>Comments</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1 -mx-6 px-6">
         <div className="space-y-4">
            {selectedPost?.comments?.map(comment => (
                <div key={comment.id} className="flex items-start gap-3">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.avatar} data-ai-hint="person abstract" />
                        <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{comment.authorId === user?.uid ? 'You' : comment.author}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                    </div>
                </div>
            ))}
            {(!selectedPost?.comments || selectedPost?.comments.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first to reply!</p>
            )}
         </div>
      </ScrollArea>
      <SheetFooter className="mt-auto">
         {canPost ? (
            <div className="flex items-end gap-2 w-full">
                <Textarea 
                    placeholder="Add a comment..."
                    className="min-h-[40px] max-h-24"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                        }
                    }}
                />
                <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send />
                </Button>
            </div>
         ) : (
            <Button asChild className="w-full">
                <Link href="/profile">Upgrade to Reply</Link>
            </Button>
         )}
      </SheetFooter>
    </SheetContent>
  </Sheet>
</div>
  );
}
