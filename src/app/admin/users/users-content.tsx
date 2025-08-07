
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Search } from "lucide-react";
import { getUsers } from "@/services/firestore";
import type { UserProfile } from "@/lib/types";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

export default function AdminUsersContent() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user, services, loading: authLoading } = useAuth();

  useEffect(() => {
    async function fetchUsers() {
      if (!services) return;
      setLoading(true);
      try {
        const userList = await getUsers(services.firestore);
        setUsers(userList);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    }
    if(!authLoading && user && services) {
        fetchUsers();
    }
  }, [user, services, authLoading]);
  
  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [users, searchTerm]);

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return format(date, "PP");
  };
  
  const pageLoading = authLoading || loading;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        </div>
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users />
                All Users
            </CardTitle>
            <CardDescription>
                View and manage all registered users on the platform.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-end mb-4">
                 <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name or email..."
                        className="pl-8 sm:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subscription Tier</TableHead>
                        <TableHead>Last Message</TableHead>
                        <TableHead>Role</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pageLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                            <TableCell><div className="flex items-center gap-2"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-24" /></div></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            </TableRow>
                        ))
                    ) : filteredUsers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">No users found.</TableCell>
                        </TableRow>
                    ) : (
                        filteredUsers.map((user) => (
                            <TableRow key={user.uid}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={
                                        user.subscriptionTier === 'Transformation' ? 'default' 
                                        : user.subscriptionTier === 'Growth' ? 'secondary'
                                        : 'outline'
                                        }
                                    >
                                        {user.subscriptionTier}
                                    </Badge>
                                </TableCell>
                                <TableCell>{formatDate(user.lastMessageDate)}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
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
