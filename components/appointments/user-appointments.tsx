"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { CalendarIcon, Clock, Video, X, MessageSquareHeart, AlertTriangle } from "lucide-react";
import { format, parseISO, isFuture, isPast } from "date-fns";
import { getUserAppointments, cancelUserAppointment } from "@/services/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@/lib/types";

export function UserAppointments() {
  const { user, services, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user || !services) {
        setLoading(false);
        return;
      }

      try {
        const userAppointments = await getUserAppointments(services.firestore, user.uid);
        setAppointments(userAppointments);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load your appointments. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchAppointments();
    }
  }, [user, services, authLoading, toast]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!user || !services) return;

    setCancellingId(appointmentId);
    try {
      await cancelUserAppointment(services.firestore, appointmentId, user.uid);
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'Cancelled' as const }
            : apt
        )
      );

      toast({
        title: "Session Cancelled",
        description: "Your SOS session has been cancelled successfully. The time slot is now available for other users.",
      });
    } catch (error: any) {
      console.error('Failed to cancel appointment:', error);
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: error.message || "Could not cancel your appointment. Please try again.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadgeVariant = (status: string, time: string) => {
    const appointmentDate = parseISO(time);
    
    switch (status) {
      case 'Upcoming':
        return isFuture(appointmentDate) ? 'default' : 'secondary';
      case 'Completed':
        return 'secondary';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string, time: string) => {
    const appointmentDate = parseISO(time);
    
    if (status === 'Upcoming' && isPast(appointmentDate)) {
      return 'Completed'; // Auto-update past appointments
    }
    return status;
  };

  const canCancel = (appointment: Appointment) => {
    return appointment.status === 'Upcoming' && isFuture(parseISO(appointment.time));
  };

  const groupedAppointments = appointments.reduce((acc, appointment) => {
    const appointmentDate = parseISO(appointment.time);
    const actualStatus = getStatusText(appointment.status, appointment.time);
    
    if (actualStatus === 'Upcoming' && isFuture(appointmentDate)) {
      acc.upcoming.push(appointment);
    } else if (actualStatus === 'Cancelled') {
      acc.cancelled.push(appointment);
    } else {
      acc.past.push(appointment);
    }
    
    return acc;
  }, { upcoming: [] as Appointment[], past: [] as Appointment[], cancelled: [] as Appointment[] });

  if (authLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Appointments</CardTitle>
          <CardDescription>Review your SOS sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Appointments</CardTitle>
          <CardDescription>Review your SOS sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to view your appointments.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const AppointmentCard = ({ appointment, showCancel = false }: { appointment: Appointment; showCancel?: boolean }) => {
    const appointmentDate = parseISO(appointment.time);
    const actualStatus = getStatusText(appointment.status, appointment.time);
    
    return (
      <div className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
          <MessageSquareHeart className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              SOS Coaching Session
            </h3>
            <Badge variant={getStatusBadgeVariant(actualStatus, appointment.time)}>
              {actualStatus}
            </Badge>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {format(appointmentDate, 'EEEE, MMMM d, yyyy')}
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
            <Clock className="w-4 h-4 mr-2" />
            {format(appointmentDate, 'h:mm a')}
          </div>
          
          {appointment.meetLink && (
            <div className="flex items-center space-x-2 mb-3">
              <Video className="w-4 h-4 text-blue-600" />
              <a 
                href={appointment.meetLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Join Video Session
              </a>
            </div>
          )}
          
          {showCancel && canCancel(appointment) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                  disabled={cancellingId === appointment.id}
                >
                  <X className="w-4 h-4 mr-1" />
                  {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel Session'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel SOS Session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your session on{' '}
                    <strong>{format(appointmentDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}</strong>?
                    This will make the time slot available for other users.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Session</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleCancelAppointment(appointment.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancel Session
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareHeart className="w-5 h-5" />
          My Appointments
        </CardTitle>
        <CardDescription>
          Review your upcoming and past SOS coaching sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquareHeart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No appointments yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Book your first SOS session to get personalized relationship coaching when you need it most.
            </p>
            <Button asChild>
              <a href="/sos">Book SOS Session</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            {groupedAppointments.upcoming.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Upcoming Sessions ({groupedAppointments.upcoming.length})
                </h3>
                <div className="space-y-3">
                  {groupedAppointments.upcoming.map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id} 
                      appointment={appointment} 
                      showCancel={true} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Appointments */}
            {groupedAppointments.past.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Past Sessions ({groupedAppointments.past.length})
                </h3>
                <div className="space-y-3">
                  {groupedAppointments.past.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled Appointments */}
            {groupedAppointments.cancelled.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Cancelled Sessions ({groupedAppointments.cancelled.length})
                </h3>
                <div className="space-y-3">
                  {groupedAppointments.cancelled.slice(0, 3).map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}