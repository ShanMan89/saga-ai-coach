
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Calendar, DollarSign, Video } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAppointments, getUsers, getAppointmentsThisWeek } from "@/services/firestore";
import type { Appointment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/auth/role-guard";

export default function AdminDashboardContent() {
  const [loading, setLoading] = useState(true);
  const { user, services, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    mrr: 4231.89,
    mrrChange: 20.1,
    subscribers: 0,
    subscribersChange: 18.1,
    appointmentsThisWeek: 0,
    appointmentsChange: 19,
    conversionRate: 5.4,
    conversionRateChange: 2.1,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!services) return;
      setLoading(true);
      try {
        const [users, appointments, appointmentsThisWeek] = await Promise.all([
          getUsers(services.firestore),
          getAppointments(services.firestore, { limit: 5 }),
          getAppointmentsThisWeek(services.firestore),
        ]);

        setStats(prev => ({
          ...prev,
          subscribers: users.length,
          appointmentsThisWeek: appointmentsThisWeek.length
        }));
        setRecentAppointments(appointments);

      } catch (error) {
        console.error("Failed to fetch admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && user && services) {
        fetchData();
    }
  }, [user, services, authLoading]);

  const formatDateTime = (isoString: string) => {
    if (!isoString) return "N/A";
    return format(new Date(isoString), "EEE, MMM d 'at' h:mm a");
  };
  
  const pageLoading = authLoading || loading;

  return (
    <RoleGuard requiredRole="admin">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Recurring Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.mrr.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.mrrChange}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {pageLoading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">+{stats.subscribers}</div>}
               <p className="text-xs text-muted-foreground">
                +{stats.subscribersChange}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {pageLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{stats.appointmentsThisWeek}</div>}
               <p className="text-xs text-muted-foreground">
                +{stats.appointmentsChange}% from last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                +{stats.conversionRateChange}% from last month
              </p>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
             <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
                <CardDescription>An overview of your most recently booked SOS sessions.</CardDescription>
             </CardHeader>
             <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageLoading ? (
                           Array.from({ length: 3 }).map((_, i) => (
                             <TableRow key={i}>
                               <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                               <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                             </TableRow>
                           ))
                        ) : (
                          recentAppointments.map((appt) => (
                              <TableRow key={appt.id}>
                                  <TableCell>
                                      <div className="font-medium">{appt.user}</div>
                                      <div className="text-sm text-muted-foreground">{appt.email}</div>
                                  </TableCell>
                                  <TableCell>{formatDateTime(appt.time)}</TableCell>
                                  <TableCell>
                                      <Badge variant={appt.status === 'Completed' ? 'secondary' : appt.status === 'Cancelled' ? 'destructive' : 'default'}>{appt.status}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="outline" size="sm">
                                          <Video className="mr-2 h-4 w-4" />
                                          Join
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))
                        )}
                    </TableBody>
                 </Table>
             </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
