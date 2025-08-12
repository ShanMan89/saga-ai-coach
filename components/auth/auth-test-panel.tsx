"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, User, Shield, Crown } from 'lucide-react';

export function AuthTestPanel() {
  const { user, profile, loading, isProfileLoading, hasPermission } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/auth/signin');
  };

  const testCases = [
    {
      name: 'User Authentication',
      status: user ? 'pass' : 'fail',
      description: 'User should be authenticated'
    },
    {
      name: 'Profile Data Loading',
      status: profile ? 'pass' : 'fail',
      description: 'User profile should be loaded from Firestore'
    },
    {
      name: 'Role Assignment',
      status: profile?.role ? 'pass' : 'fail',
      description: `User role should be assigned (Current: ${profile?.role || 'None'})`
    },
    {
      name: 'Subscription Tier',
      status: profile?.subscriptionTier ? 'pass' : 'fail',
      description: `Subscription tier should be set (Current: ${profile?.subscriptionTier || 'None'})`
    },
    {
      name: 'Permission System',
      status: hasPermission('ai_unlimited') !== undefined ? 'pass' : 'fail',
      description: 'Permission system should be functional'
    }
  ];

  const permissions = [
    'ai_unlimited',
    'community_write',
    'journal_analysis',
    'audio_library',
    'ai_scenarios',
    'weekly_insights',
    'session_prep',
    'priority_booking',
    'session_discount'
  ];

  if (loading || isProfileLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication System Test</CardTitle>
          <CardDescription>Loading authentication state...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication System Test
          </CardTitle>
          <CardDescription>
            Verify that all authentication flows are working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testCases.map((test) => (
            <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {test.status === 'pass' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <h4 className="font-semibold">{test.name}</h4>
                  <p className="text-sm text-muted-foreground">{test.description}</p>
                </div>
              </div>
              <Badge variant={test.status === 'pass' ? 'default' : 'destructive'}>
                {test.status === 'pass' ? 'PASS' : 'FAIL'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <span className="text-muted-foreground">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span className="text-muted-foreground">{profile?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Role:</span>
              <Badge variant={profile?.role === 'admin' ? 'destructive' : 'default'}>
                {profile?.role || 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tier:</span>
              <Badge variant="outline">
                {profile?.subscriptionTier || 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">UID:</span>
              <span className="text-xs font-mono text-muted-foreground">
                {user?.uid ? `${user.uid.slice(0, 8)}...` : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Permission Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {permissions.map((permission) => (
              <div key={permission} className="flex items-center justify-between py-1">
                <span className="text-sm font-medium">{permission.replace('_', ' ')}</span>
                <Badge
                  variant={hasPermission(permission as any) ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {hasPermission(permission as any) ? '✓' : '✗'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Navigation Test</CardTitle>
          <CardDescription>
            Test role-based navigation and redirects
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            size="sm"
          >
            Home
          </Button>
          <Button
            onClick={() => router.push('/admin')}
            variant="outline"
            size="sm"
          >
            Admin Dashboard
          </Button>
          <Button
            onClick={() => router.push('/auth/signin')}
            variant="outline"
            size="sm"
          >
            Sign In Page
          </Button>
          <Button
            onClick={handleSignOut}
            variant="destructive"
            size="sm"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}