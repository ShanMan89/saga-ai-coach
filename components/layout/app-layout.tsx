
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bot, BookText, Home, Users, User, LucideIcon, MessageSquareHeart, LogOut, LayoutDashboard, Calendar, CalendarCheck, AudioWaveform, PanelLeft } from "lucide-react";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { SagaLogo } from "../logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "../ui/skeleton";
import { getAuth, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, profile, isProfileLoading } = useAuth();
  const { toast } = useToast();

  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname.startsWith('/auth');

  // Define menus
  const userMenuItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/chat", label: "Saga AI", icon: Bot },
    { href: "/journal", label: "Journal", icon: BookText },
    { href: "/community", label: "Community", icon: Users },
    // { href: "/sos", label: "SOS Session", icon: MessageSquareHeart }, // Temporarily disabled
  ];
  
  const adminMenuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/calendar", label: "My Calendar", icon: Calendar },
    { href: "/admin/appointments", label: "Appointments", icon: CalendarCheck },
    { href: "/admin/content", label: "Content", icon: AudioWaveform },
  ];

  const menuItems = isAdminPage ? adminMenuItems : userMenuItems;
  const isFullWidthPage = pathname === '/chat' || pathname === '/journal' || pathname === '/community';

  // Auth and routing effect
  useEffect(() => {
    // Wait until both auth and profile loading are fully complete
    if (loading || isProfileLoading) return;

    if (!user && !isAuthPage) {
      router.push('/auth/signin');
      return; // Stop execution after redirect
    }
    
    if (user && profile) {
      if (profile.role === 'admin' && !isAdminPage) {
        router.push('/admin');
      } else if (profile.role !== 'admin' && isAdminPage) {
        router.push('/');
      }
    }

  }, [user, profile, loading, isProfileLoading, router, pathname, isAuthPage, isAdminPage]);

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    toast({ title: "Signed Out", description: "You have been successfully signed out." });
    router.push('/auth/signin');
  };
  
  const showLoadingSpinner = loading || (user && isProfileLoading);

  // Initial loading screen for the entire app
  if (showLoadingSpinner && !isAuthPage) {
     return (
        <div className="flex items-center justify-center h-screen bg-background">
             <div className="flex flex-col items-center gap-4">
                <SagaLogo className="w-12 h-12 animate-pulse" />
                <p className="text-muted-foreground">Loading your experience...</p>
             </div>
        </div>
      )
  }

  // Render children directly for auth pages, as they have their own layout
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  // This state can happen if a non-authed user tries to access a protected page.
  // The useEffect above will handle redirection, so we can show a minimal loader.
  if (!profile) {
      return (
          <div className="flex items-center justify-center h-screen bg-background">
              <SagaLogo className="w-16 h-16 animate-pulse" />
          </div>
      );
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <SagaLogo className="w-8 h-8" />
              <span className="text-lg font-semibold">{isAdminPage ? "Saga Admin" : "Saga"}</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== '/admin')}
                    tooltip={{ children: item.label, side: "right" }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              {!isAdminPage && (
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/profile'} tooltip={{ children: "Profile", side: "right" }}>
                    <Link href="/profile">
                        <User />
                        <span>Profile</span>
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )}
               {isAdminPage && (
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{ children: "Exit Admin", side: "right" }}>
                        <Link href="/">
                            <LogOut />
                            <span>Exit Admin</span>
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
               )}
              <SidebarMenuItem>
                 <SidebarMenuButton onClick={handleSignOut} tooltip={{ children: "Sign Out", side: "right" }}>
                   <LogOut />
                   <span>Sign Out</span>
                 </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
             <div className="border-t p-2 mt-2">
                <Link href={isAdminPage ? "#" : "/profile"} className={cn("flex items-center gap-2", isAdminPage && "pointer-events-none")}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar} alt={profile?.name || 'User'} data-ai-hint="person" />
                        <AvatarFallback>{profile?.name?.charAt(0) || 'S'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-sm font-semibold truncate">{profile?.name || 'Saga User'}</span>
                        <span className="text-xs text-muted-foreground capitalize">{profile?.role === 'admin' ? profile.role : profile.subscriptionTier + ' Tier'}</span>
                    </div>
                </Link>
             </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-background flex flex-col flex-1">
           <MobileHeader isAdminPage={isAdminPage} />
           <main className={cn("flex-1 h-full pb-16 md:pb-0", isFullWidthPage ? "flex flex-col" : "")}>
            {children}
          </main>
          {!isAdminPage && <MobileBottomNav menuItems={userMenuItems} pathname={pathname} />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function MobileHeader({ isAdminPage }: { isAdminPage: boolean }) {
    const { toggleSidebar } = useSidebar();
    return (
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
            <Link href={isAdminPage ? "/admin" : "/"} className="flex items-center gap-2">
              <SagaLogo className="w-6 h-6" />
              <span className="font-semibold">{isAdminPage ? "Saga Admin" : "Saga"}</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <PanelLeft />
            </Button>
        </header>
    )
}

interface MenuItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

function MobileBottomNav({ menuItems, pathname }: { menuItems: MenuItem[], pathname: string }) {
    const navItems = [...menuItems, { href: '/profile', label: 'Profile', icon: User }];
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-10">
            <div className="flex justify-around items-center h-full">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full text-xs gap-1",
                            pathname === item.href
                                ? "text-primary"
                                : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px]">{item.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
