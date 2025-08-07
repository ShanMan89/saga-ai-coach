
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CalendarCheck, MoreHorizontal, Video, Search, Ban } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAppointments, updateAppointmentStatus } from "@/services/firestore";
import type { Appointment } from "@/lib/types";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type Status = "Upcoming" | "Completed" | "Cancelled";

export default function AdminAppointmentsContent() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState<Status>("Upcoming");
  const { toast } = useToast();
  const { user, services, loading: authLoading } = useAuth();

  const fetchAppointments = async () => {
    if (!services) return;
    setLoading(true);
    try {
      const appts = await getAppointments(services.firestore);
      const processedAppts = appts.map(appt => ({
          ...appt,
          status: appt.status === 'Confirmed' ? 'Upcoming' : appt.status
      }));
      setAppointments(processedAppts);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch appointments." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if(!authLoading && user && services) {
        fetchAppointments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, services]);
  
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appt) => appt.status === activeTab)
      .filter((appt) => {
        const appointmentDate = new Date(appt.time);
        if (dateRange?.from && appointmentDate < dateRange.from) return false;
        if (dateRange?.to && appointmentDate > dateRange.to) return false;
        return true;
      })
      .filter((appt) =>
        appt.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [appointments, activeTab, dateRange, searchTerm]);

  const handleCancelSession = async (appointmentId: string) => {
    if (!services) return;
    try {
        await updateAppointmentStatus(services.firestore, appointmentId, 'Cancelled');
        toast({ title: "Session Cancelled", description: "The appointment has been successfully cancelled." });
        await fetchAppointments(); // Re-fetch to update the UI
    } catch (error) {
        console.error("Failed to cancel session:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to cancel the session." });
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return format(date, "PPpp");
  };
  
  const pageLoading = authLoading || loading;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CalendarCheck />
                Manage Appointments
            </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Status)}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <TabsList>
                    <TabsTrigger value="Upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="Completed">Completed</TabsTrigger>
                    <TabsTrigger value="Cancelled">Cancelled</TabsTrigger>
                </TabsList>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
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
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className="justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pick a date range</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <TabsContent value={activeTab}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Scheduled For</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageLoading ? (
                           Array.from({ length: 3 }).map((_, i) => (
                             <TableRow key={i}>
                               <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                               <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                             </TableRow>
                           ))
                        ) : filteredAppointments.length === 0 ? (
                            <TableRow>
                                 <TableCell colSpan={4} className="text-center h-24">No appointments found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredAppointments.map((appt) => (
                                <TableRow key={appt.id}>
                                    <TableCell>
                                        <div className="font-medium">{appt.user}</div>
                                        <div className="text-sm text-muted-foreground">{appt.email}</div>
                                    </TableCell>
                                    <TableCell>{formatDateTime(appt.time)}</TableCell>
                                    <TableCell>
                                        <Badge 
                                           variant={
                                            appt.status === 'Completed' ? 'secondary' 
                                            : appt.status === 'Cancelled' ? 'destructive'
                                            : 'default'
                                           }
                                        >
                                          {appt.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem disabled={!appt.meetLink} onClick={() => appt.meetLink && window.open(appt.meetLink, '_blank')}>
                                                    <Video className="mr-2 h-4 w-4" />
                                                    Join Session
                                                </DropdownMenuItem>
                                                {appt.status !== 'Cancelled' && (
                                                   <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive w-full">
                                                                <Ban className="mr-2 h-4 w-4" />
                                                                Cancel Session
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently cancel the session.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Back</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleCancelSession(appt.id)}>
                                                                    Yes, Cancel Session
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                   </AlertDialog>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
