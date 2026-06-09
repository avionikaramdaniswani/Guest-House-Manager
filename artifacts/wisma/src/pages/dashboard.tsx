import { useState } from "react";
import { 
  useGetDashboardSummary, 
  useGetTodayActivity, 
  useGetAlerts 
} from "@workspace/api-client-react";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Bed, CheckCircle2, Clock, LogIn, LogOut, TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: isLoadingActivity } = useGetTodayActivity();
  const { data: alerts, isLoading: isLoadingAlerts } = useGetAlerts();

  if (isLoadingSummary || isLoadingActivity || isLoadingAlerts) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.occupancy_rate.toFixed(1)}%</div>
            <Progress value={summary?.occupancy_rate || 0} className="h-2 mt-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {summary?.occupied} of {summary?.total_rooms} rooms occupied
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-status-available" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.available}</div>
            <p className="text-xs text-muted-foreground mt-2 text-status-available">
              Ready for check-in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Long Stays</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((summary?.long_stay_japan || 0) + (summary?.long_stay_local || 0))}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-status-long-japan/10 text-status-long-japan border-status-long-japan/20">
                {summary?.long_stay_japan} Japan
              </Badge>
              <Badge variant="outline" className="bg-status-long-local/10 text-status-long-local border-status-long-local/20">
                {summary?.long_stay_local} Local
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Today</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary?.revenue_today)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Month to date: {formatRupiah(summary?.revenue_month)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-status-available" />
                Today's Check-ins
                <Badge variant="secondary" className="ml-2">{activity?.check_ins.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity?.check_ins.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No check-ins scheduled for today</div>
              ) : (
                <div className="space-y-4">
                  {activity?.check_ins.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {booking.room_number}
                        </div>
                        <div>
                          <p className="font-medium">{booking.guest_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.status === 'checked_in' ? 'Arrived at ' + formatDateTime(booking.actual_check_in) : 'Expected today'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={booking.status === 'checked_in' ? 'default' : 'outline'} className={booking.status === 'checked_in' ? 'bg-status-available hover:bg-status-available' : ''}>
                        {booking.status === 'checked_in' ? 'Checked In' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-destructive" />
                Today's Check-outs
                <Badge variant="secondary" className="ml-2">{activity?.check_outs.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity?.check_outs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No check-outs scheduled for today</div>
              ) : (
                <div className="space-y-4">
                  {activity?.check_outs.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                          {booking.room_number}
                        </div>
                        <div>
                          <p className="font-medium">{booking.guest_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.status === 'checked_out' ? 'Left at ' + formatDateTime(booking.actual_check_out) : 'Expected today'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={booking.status === 'checked_out' ? 'secondary' : 'outline'}>
                        {booking.status === 'checked_out' ? 'Checked Out' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-sm border-destructive/20 h-full">
            <CardHeader className="bg-destructive/5 border-b border-destructive/10">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Needs Attention
                {alerts && alerts.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">{alerts.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(!alerts || alerts.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center">
                  <CheckCircle2 className="h-10 w-10 text-status-available/50 mb-3" />
                  <p>All clear! No alerts at the moment.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {alerts.map((alert, i) => (
                    <div key={i} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm bg-muted px-2 py-0.5 rounded">{alert.room_number}</span>
                          <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm mt-2">{alert.message}</p>
                      {alert.days_remaining !== null && alert.days_remaining !== undefined && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.days_remaining < 0 
                            ? `Overdue by ${Math.abs(alert.days_remaining)} days`
                            : `${alert.days_remaining} days remaining`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
