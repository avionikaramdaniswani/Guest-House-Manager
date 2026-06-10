import { useState } from "react";
import { useGetBookings } from "@workspace/api-client-react";
import { formatDate, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Plus, Search } from "lucide-react";

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
      case 'reserved': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Reservasi</Badge>;
      case 'checked_in': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Check-in</Badge>;
      case 'checked_out': return <Badge variant="secondary">Check-out</Badge>;
      case 'cancelled': return <Badge variant="destructive">Dibatalkan</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <CalendarDays className="w-8 h-8" />
          Pemesanan
        </h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pemesanan
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari tamu atau kamar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="reserved">Reservasi</SelectItem>
                <SelectItem value="checked_in">Check-in</SelectItem>
                <SelectItem value="checked_out">Check-out</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tamu</TableHead>
                <TableHead>Kamar</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Memuat data pemesanan...</TableCell>
                </TableRow>
              ) : filteredBookings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Tidak ada pemesanan ditemukan.</TableCell>
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
                        <span className="text-xs text-muted-foreground">Reguler</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
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
