
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, OAuthProvider } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SagaLogo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.417-11.303-8H6.306C9.656,39.663,16.318,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,36.494,44,30.836,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.003 16.909c-1.302 0-2.61-.482-3.422-1.385-.811-.904-1.39-2.299-1.39-3.953 0-2.24 1.021-3.693 2.536-3.693.84 0 1.57.482 2.219.482.619 0 1.485-.482 2.374-.482 1.39 0 2.8.962 2.8 2.83 0 1.272-.619 2.24-1.421 3.033-.741.742-1.63 1.145-2.695 1.145zm3.766-6.423c.03-1.67-.99-2.584-2.189-2.584-.65 0-1.39.482-2.074.482-.65 0-1.36-.482-2.044-.482-1.21 0-2.25.873-2.25 2.526 0 1.524.871 2.977 2.013 3.866.771.65 1.751 1.21 2.92 1.21.24 0 .48-.03.71-.06.03-.03.03-2.396.03-2.426 0-.21-.03-.45-.06-.65-.33-.09-.9-.39-1.22-.68-.61-.57-.92-1.32-.92-2.07 0-.12.02-.24.05-.36.21.03.45.06.68.06.89 0 1.6-.45 2.25-.45.68 0 1.33.45 2.07.45.18 0 .36-.03.54-.06z" />
    </svg>
);

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<null | 'google' | 'apple'>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { services } = useAuth();

  const handleSuccessfulLogin = async () => {
    // A short delay to allow the `onCreateUser` cloud function to set custom claims.
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({ title: "Success", description: "Account created successfully. Welcome!" });
    // The AppLayout will now handle the role-based redirection.
    router.push('/');
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!services) {
        toast({ variant: "destructive", title: "Authentication service not available." });
        return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(services.auth, email, password);
      await handleSuccessfulLogin();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (providerName: 'google' | 'apple') => {
    if (!services) {
        toast({ variant: "destructive", title: "Authentication service not available." });
        return;
    }
    setSocialLoading(providerName);
    
    let provider;
    if (providerName === 'google') {
        provider = new GoogleAuthProvider();
    } else {
        provider = new OAuthProvider('apple.com');
    }

    try {
      await signInWithPopup(services.auth, provider);
      await handleSuccessfulLogin();
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: error.code === 'auth/account-exists-with-different-credential' 
            ? "An account already exists with the same email address but different sign-in credentials."
            : error.message,
      });
    } finally {
      setSocialLoading(null);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <SagaLogo className="w-12 h-12" />
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Start your journey with Saga today.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => handleSocialSignIn('google')} disabled={!!socialLoading || !services}>
              {socialLoading === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2"/>}
              Google
            </Button>
            <Button variant="outline" onClick={() => handleSocialSignIn('apple')} disabled={!!socialLoading || !services}>
              {socialLoading === 'apple' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AppleIcon className="mr-2"/>}
              Apple
            </Button>
          </div>
          <div className="flex items-center">
            <Separator className="flex-1" />
            <span className="px-4 text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>
        </CardContent>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!socialLoading || !services}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!!socialLoading || !services}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading || !!socialLoading || !services}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
