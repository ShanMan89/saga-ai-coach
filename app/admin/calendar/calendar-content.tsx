
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, PlusCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfDay } from "date-fns";
import { getAdminSchedule, updateAdminSchedule } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailySchedule } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

export default function AdminCalendarContent() {
    const [date, setDate] = useState<Date | undefined>();
    const [schedule, setSchedule] = useState<DailySchedule | null>(null);
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<"Available" | "Unavailable">("Available");
    const { toast } = useToast();
    const { services, loading: authLoading } = useAuth();

    useEffect(() => {
        setDate(new Date());
    }, []);

    useEffect(() => {
        if (authLoading || !date || !services) return;

        const fetchSchedule = async () => {
            setLoadingSchedule(true);
            try {
                const fetchedSchedule = await getAdminSchedule(services.firestore, date);
                setSchedule(fetchedSchedule);
            } catch (error) {
                console.error("Failed to fetch schedule:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load schedule." });
            } finally {
                setLoadingSchedule(false);
            }
        };

        fetchSchedule();
    }, [date, services, toast, authLoading]);

    const timeSlots = Array.from({ length: 10 }, (_, i) => {
        const hour = 9 + i;
        return `${hour < 10 ? '0' : ''}${hour}:00`;
    });

    const displaySchedule = useMemo(() => {
        return timeSlots.map(slot => {
            const status = schedule?.slots[slot]?.status || 'Unavailable';
            const user = schedule?.slots[slot]?.user;
            return { time: slot, status, user };
        });
    }, [timeSlots, schedule]);

    const handleUpdateSchedule = async () => {
        if (!date || !selectedTime || !services) {
            toast({ variant: "destructive", title: "Error", description: "Please select a date and time." });
            return;
        }

        try {
            await updateAdminSchedule(services.firestore, date, selectedTime, selectedStatus);
            toast({ title: "Schedule Updated", description: `Set ${selectedTime} to ${selectedStatus}.` });
            const fetchedSchedule = await getAdminSchedule(services.firestore, date);
            setSchedule(fetchedSchedule);
        } catch (error) {
            console.error("Failed to update schedule:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not update schedule." });
        }
    };
    
    const pageLoading = authLoading || loadingSchedule;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">My Calendar</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon />
                            Manage Your Availability
                        </CardTitle>
                        <CardDescription>
                            Select a date to view and manage your schedule for SOS sessions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                            disabled={(d) => d < startOfDay(new Date())}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock />
                            Schedule for {date ? format(date, 'PPP') : '...'}
                        </CardTitle>
                        <CardDescription>Set your status for different time slots.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 h-64 overflow-y-auto pr-2">
                           {pageLoading ? (
                                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                           ) : displaySchedule.map(appt => (
                             <div key={appt.time} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <span className="font-medium">{format(new Date(`1970-01-01T${appt.time}:00`), 'p')}</span>
                                {appt.status === 'Booked' ? (
                                    <Badge variant="secondary">{appt.user}</Badge>
                                ) : (
                                    <Badge variant={appt.status === 'Available' ? 'default' : 'destructive'}>{appt.status}</Badge>
                                )}
                             </div>
                           ))}
                        </div>
                        <div className="border-t pt-4 space-y-2">
                            <h4 className="font-semibold">Update Status</h4>
                            <div className="flex items-center gap-2">
                                <Select onValueChange={setSelectedTime}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeSlots.map(slot => <SelectItem key={slot} value={slot}>{format(new Date(`1970-01-01T${slot}:00`), 'p')}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={(v) => setSelectedStatus(v as "Available" | "Unavailable")} defaultValue="Available">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Set Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Available">Available</SelectItem>
                                        <SelectItem value="Unavailable">Unavailable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full" onClick={handleUpdateSchedule}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Update Schedule
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
