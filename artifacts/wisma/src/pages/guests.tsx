import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetGuests, getGetGuestsQueryKey } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users, Search, Building2, History, BedDouble, LogIn, LogOut,
  ChevronRight, Plus, Pencil, Trash2, Loader2, Check, X,
} from "lucide-react";
import { getToken } from "@/lib/auth";

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
  reserved:    { label: "Reservasi",  className: "bg-yellow-100 text-yellow-700" },
  checked_in:  { label: "Check-in",  className: "bg-green-100  text-green-700" },
  checked_out: { label: "Check-out", className: "bg-gray-100   text-gray-600" },
  cancelled:   { label: "Batal",     className: "bg-red-100    text-red-700" },
};

const STAY_LABELS: Record<string, string> = {
  regular:         "Reguler",
  long_stay:       "Long Stay",
  long_stay_japan: "Long Stay Jepang",
  long_stay_local: "Long Stay Lokal",
};

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function AddGuestDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName]       = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function reset() { setName(""); setCompany(""); setError(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nama wajib diisi."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), company: company.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Gagal menambah tamu.");
        return;
      }
      onCreated();
      onOpenChange(false);
      reset();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Plus className="w-4 h-4" /> Tambah Tamu
          </DialogTitle>
          <DialogDescription>Daftarkan tamu baru ke direktori.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="add-name">Nama <span className="text-destructive">*</span></Label>
            <Input
              id="add-name"
              placeholder="Nama lengkap tamu"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-company">Perusahaan</Label>
            <Input
              id="add-company"
              placeholder="Nama perusahaan (opsional)"
              value={company}
              onChange={e => setCompany(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onOpenChange(false); }} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GuestDetailSheet({
  guest,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: {
  guest: Guest | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [bookings, setBookings]               = useState<GuestBooking[]>([]);
  const [loadingHistory, setLoadingHistory]   = useState(false);
  const [historyLoaded, setHistoryLoaded]     = useState(false);

  const [editing, setEditing]       = useState(false);
  const [editName, setEditName]     = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [saving, setSaving]         = useState(false);
  const [editError, setEditError]   = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  const loadHistory = async (guestId: number) => {
    if (historyLoaded) return;
    setLoadingHistory(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/guests/${guestId}/bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setBookings(await res.json());
    } finally {
      setLoadingHistory(false);
      setHistoryLoaded(true);
    }
  };

  if (open && guest && !historyLoaded && !loadingHistory) {
    loadHistory(guest.id);
  }

  const handleClose = () => {
    setBookings([]); setHistoryLoaded(false);
    setEditing(false); setEditError(null);
    setConfirmDelete(false); setDeleteError(null);
    onClose();
  };

  const startEdit = () => {
    if (!guest) return;
    setEditName(guest.name);
    setEditCompany(guest.company ?? "");
    setEditError(null);
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setEditError(null); };

  const saveEdit = async () => {
    if (!guest) return;
    if (!editName.trim()) { setEditError("Nama wajib diisi."); return; }
    setSaving(true); setEditError(null);
    try {
      const res = await fetch(`/api/guests/${guest.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ name: editName.trim(), company: editCompany.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setEditError(d.error ?? "Gagal menyimpan.");
        return;
      }
      onUpdated();
      setEditing(false);
    } catch {
      setEditError("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!guest) return;
    setDeleting(true); setDeleteError(null);
    try {
      const res = await fetch(`/api/guests/${guest.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setDeleteError(d.error ?? "Gagal menghapus tamu.");
        setConfirmDelete(false);
        return;
      }
      onDeleted();
      handleClose();
    } catch {
      setDeleteError("Terjadi kesalahan jaringan.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const statusMeta = (s: string) => STATUS_LABELS[s] ?? { label: s, className: "bg-gray-100 text-gray-600" };

  return (
    <>
      <Sheet open={open} onOpenChange={v => { if (!v) handleClose(); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {guest && (
            <>
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="flex items-center gap-3 text-xl">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {(editing ? editName : guest.name)[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="Nama tamu"
                          className="h-8 text-base font-semibold"
                          autoFocus
                        />
                        <Input
                          value={editCompany}
                          onChange={e => setEditCompany(e.target.value)}
                          placeholder="Perusahaan (opsional)"
                          className="h-8 text-sm"
                        />
                        {editError && <p className="text-xs text-destructive">{editError}</p>}
                        <div className="flex gap-1.5">
                          <Button size="sm" className="h-7 text-xs gap-1" onClick={saveEdit} disabled={saving}>
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Simpan
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={cancelEdit} disabled={saving}>
                            <X className="w-3 h-3" /> Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-bold text-foreground leading-tight truncate">{guest.name}</p>
                        {guest.company && (
                          <p className="text-sm font-normal text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 shrink-0" /> {guest.company}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </SheetTitle>
                {!editing && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">Terdaftar {formatDate(guest.created_at)}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={startEdit}>
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDelete(true)}
                        disabled={deleting}
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </Button>
                    </div>
                  </div>
                )}
                {deleteError && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded p-2 mt-2">{deleteError}</p>
                )}
              </SheetHeader>

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
                              <span>Masuk: <span className="text-foreground font-medium">{formatDate(b.check_in_date)}</span></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <LogOut className="w-3 h-3 text-orange-500" />
                              <span>Keluar: <span className="text-foreground font-medium">{formatDate(b.check_out_date)}</span></span>
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

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus tamu ini?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{guest?.name}</strong> akan dihapus permanen dari direktori.
              Tamu yang masih memiliki riwayat booking tidak bisa dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Guests() {
  const qc = useQueryClient();
  const [search, setSearch]               = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: guests, isLoading } = useGetGuests();

  const filteredGuests = guests?.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const refresh = () => qc.invalidateQueries({ queryKey: getGetGuestsQueryKey() });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <Users className="w-8 h-8" />
          Direktori Tamu
        </h1>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Tamu
        </Button>
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
          {guests && (
            <p className="ml-auto text-sm text-muted-foreground">
              {filteredGuests?.length ?? 0} tamu
            </p>
          )}
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
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Memuat data tamu...
                  </TableCell>
                </TableRow>
              ) : filteredGuests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    {search ? "Tidak ada tamu ditemukan." : "Belum ada tamu terdaftar."}
                  </TableCell>
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

      <AddGuestDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreated={refresh}
      />

      <GuestDetailSheet
        guest={selectedGuest}
        open={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
        onUpdated={refresh}
        onDeleted={() => { refresh(); setSelectedGuest(null); }}
      />
    </div>
  );
}
