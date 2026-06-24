import { useState } from "react";
import { useGetGuests } from "@workspace/api-client-react";
import { format } from "date-fns";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Users, Search, Building2, History, BedDouble, LogIn, LogOut, CalendarDays, ChevronRight } from "lucide-react";

type GuestBooking = {
  id: number;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  status: string;
  stay_type: string;
  occupied_persons: number;
  notes: string | null;
};

type Guest = {
  id: number;
  name: string;
  company: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  reserved:    { label: "Reservasi",  className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  checked_in:  { label: "Check-in",  className: "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400" },
  checked_out: { label: "Check-out", className: "bg-gray-100   text-gray-600   dark:bg-zinc-800     dark:text-gray-400" },
  cancelled:   { label: "Batal",     className: "bg-red-100    text-red-700    dark:bg-red-900/30   dark:text-red-400" },
};

const STAY_LABELS: Record<string, string> = {
  regular:         "Reguler",
  long_stay:       "Long Stay",
  long_stay_japan: "Long Stay Jepang",
  long_stay_local: "Long Stay Lokal",
};

function GuestDetailSheet({
  guest,
  open,
  onClose,
}: {
  guest: Guest | null;
  open: boolean;
  onClose: () => void;
}) {
  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("wisma_token") : null;

  const loadHistory = async (guestId: number) => {
    if (historyLoaded) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/guests/${guestId}/bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } finally {
      setLoadingHistory(false);
      setHistoryLoaded(true);
    }
  };

  const handleOpen = (g: Guest | null) => {
    if (g && open && !historyLoaded) {
      loadHistory(g.id);
    }
  };

  if (open && guest && !historyLoaded && !loadingHistory) {
    loadHistory(guest.id);
  }

  const handleClose = () => {
    setBookings([]);
    setHistoryLoaded(false);
    onClose();
  };

  const statusMeta = (s: string) => STATUS_LABELS[s] ?? { label: s, className: "bg-gray-100 text-gray-600" };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {guest && (
          <>
            <SheetHeader className="pb-4 border-b">
              <SheetTitle className="flex items-center gap-3 text-xl">
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {guest.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground leading-tight">{guest.name}</p>
                  {guest.company && (
                    <p className="text-sm font-normal text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" /> {guest.company}
                    </p>
                  )}
                </div>
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Terdaftar {formatDate(guest.created_at)}
              </p>
            </SheetHeader>

            {/* Booking History */}
            <div className="mt-5">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground mb-3">
                <History className="w-4 h-4 text-primary" />
                Riwayat Menginap
                {bookings.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">{bookings.length}x</Badge>
                )}
              </h3>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Belum ada riwayat menginap
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => {
                    const sm = statusMeta(b.status);
                    return (
                      <div key={b.id} className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <BedDouble className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">Kamar {b.room_number}</p>
                              <p className="text-xs text-muted-foreground">{STAY_LABELS[b.stay_type] ?? b.stay_type}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${sm.className}`}>
                            {sm.label}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <LogIn className="w-3 h-3 text-green-500" />
                            <span>Check-in: <span className="text-foreground font-medium">{formatDate(b.check_in_date)}</span></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <LogOut className="w-3 h-3 text-orange-500" />
                            <span>Check-out: <span className="text-foreground font-medium">{formatDate(b.check_out_date)}</span></span>
                          </div>
                          {b.occupied_persons > 1 && (
                            <div className="flex items-center gap-1 col-span-2">
                              <Users className="w-3 h-3" />
                              <span>{b.occupied_persons} orang</span>
                            </div>
                          )}
                          {b.notes && (
                            <div className="col-span-2 italic text-muted-foreground/70 truncate" title={b.notes}>
                              "{b.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function Guests() {
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const { data: guests, isLoading } = useGetGuests();

  const filteredGuests = guests?.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <Users className="w-8 h-8" />
          Direktori Tamu
        </h1>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b px-6 py-4 flex flex-row items-center sticky top-0 bg-card z-10">
          <div className="relative w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau perusahaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead>Nama Tamu</TableHead>
                <TableHead>Perusahaan</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Memuat data tamu...</TableCell>
                </TableRow>
              ) : filteredGuests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Tidak ada tamu ditemukan.</TableCell>
                </TableRow>
              ) : (
                filteredGuests?.map(guest => (
                  <TableRow
                    key={guest.id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedGuest(guest as Guest)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{guest.name[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-foreground">{guest.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {guest.company ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="w-3 h-3" />
                          {guest.company}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(guest.created_at)}</TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <GuestDetailSheet
        guest={selectedGuest}
        open={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
      />
    </div>
  );
}
