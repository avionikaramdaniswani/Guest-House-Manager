import { useState } from "react";
import { useGetBookings, useCreateBooking } from "@workspace/api-client-react";
import { formatRupiah, formatDate, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarDays, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetBookingsQueryKey } from "@workspace/api-client-react";

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { data: bookings, isLoading } = useGetBookings(statusFilter !== "all" ? { status: statusFilter as any } : undefined);

  const filteredBookings = bookings?.filter(b => 
    b.guest_name.toLowerCase().includes(search.toLowerCase()) || 
    b.room_number.includes(search)
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'reserved': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Reserved</Badge>;
      case 'checked_in': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Checked In</Badge>;
      case 'checked_out': return <Badge variant="secondary">Checked Out</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <CalendarDays className="w-8 h-8" />
          Bookings
        </h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guest or room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price/Night</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading bookings...</TableCell>
                </TableRow>
              ) : filteredBookings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No bookings found.</TableCell>
                </TableRow>
              ) : (
                filteredBookings?.map(booking => (
                  <TableRow key={booking.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <TableCell className="font-medium text-xs text-muted-foreground">#{booking.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.guest_name}</div>
                      <div className="text-xs text-muted-foreground">{booking.guest_nationality}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">{booking.room_number}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(booking.check_in_date)}</TableCell>
                    <TableCell>{formatDate(booking.check_out_date)}</TableCell>
                    <TableCell>
                      {booking.stay_type === 'long_stay' ? (
                        <Badge variant="secondary" className="text-xs">Long Stay</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Regular</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(booking.price_per_night)}</TableCell>
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
