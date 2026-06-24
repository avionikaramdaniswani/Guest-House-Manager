import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCheck } from "lucide-react";
import type { Room } from "@workspace/api-client-react";
import { getGetRoomsQueryKey } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";

interface Props {
  room: Room;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

const JAPAN_LONGSTAY_ROOMS = new Set(["23","24","27","30","31","54","55","60"]);
const LOCAL_LONGSTAY_ROOMS  = new Set(["61","62"]);

type StayType = "regular" | "long_stay_japan" | "long_stay_local";

function defaultStayType(roomNumber: string): StayType {
  if (JAPAN_LONGSTAY_ROOMS.has(roomNumber)) return "long_stay_japan";
  if (LOCAL_LONGSTAY_ROOMS.has(roomNumber))  return "long_stay_local";
  return "regular";
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function diffDays(from: string, to: string) {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.max(0, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
}

function maxPersonsForStars(stars: number) {
  if (stars >= 3) return 4;
  if (stars === 2) return 3;
  return 2;
}

export default function CheckinDialog({ room, open, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const today = todayStr();

  const maxPersons = maxPersonsForStars(room.stars);

  const [guestName, setGuestName]             = useState("");
  const [company, setCompany]                 = useState("");
  const [stayType, setStayType]               = useState<StayType>(() => defaultStayType(room.number));
  const [checkIn, setCheckIn]                 = useState(today);
  const [checkOut, setCheckOut]               = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [occupiedPersons, setOccupiedPersons] = useState(1);
  const [notes, setNotes]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const totalDays = diffDays(checkIn, checkOut);

  useEffect(() => {
    if (open) {
      setGuestName("");
      setCompany("");
      setStayType(defaultStayType(room.number));
      setCheckIn(today);
      const d = new Date(); d.setDate(d.getDate() + 1);
      setCheckOut(d.toISOString().split("T")[0]);
      setOccupiedPersons(1);
      setNotes("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) { setError("Nama tamu wajib diisi."); return; }
    if (totalDays <= 0) { setError("Tanggal keluar harus setelah tanggal masuk."); return; }

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const resp = await fetch("/api/direct-checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          room_id: room.id,
          guest_name: guestName.trim(),
          company: company.trim() || null,
          check_in_date: checkIn,
          check_out_date: checkOut,
          stay_type: stayType,
          occupied_persons: occupiedPersons,
          notes: notes.trim() || null,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: "Gagal check-in" }));
        setError(data.error ?? "Gagal check-in");
        return;
      }

      await qc.invalidateQueries({ queryKey: getGetRoomsQueryKey() });
      onSuccess?.();
      onOpenChange(false);
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <UserCheck className="w-5 h-5" />
            Check-in — Kamar {room.number}
          </DialogTitle>
          <DialogDescription>
            {room.room_name ? `${room.room_name} · ` : ""}
            Blok {room.block} · {"★".repeat(room.stars)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Nama Tamu */}
          <div className="space-y-1.5">
            <Label htmlFor="ci-name">Nama Tamu <span className="text-destructive">*</span></Label>
            <Input
              id="ci-name"
              placeholder="Nama lengkap tamu"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label htmlFor="ci-company">Perusahaan</Label>
            <Input
              id="ci-company"
              placeholder="Nama perusahaan (opsional)"
              value={company}
              onChange={e => setCompany(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Info kamar (readonly) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nomor Kamar</Label>
              <Input value={room.number} readOnly className="bg-muted/50 cursor-default" />
            </div>
            <div className="space-y-1.5">
              <Label>Nama Kamar</Label>
              <Input value={room.room_name ?? "—"} readOnly className="bg-muted/50 cursor-default" />
            </div>
          </div>

          {/* Tipe Menginap */}
          <div className="space-y-1.5">
            <Label>Tipe Menginap</Label>
            <Select value={stayType} onValueChange={v => setStayType(v as StayType)} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Reguler</SelectItem>
                <SelectItem value="long_stay_japan">Long Stay Jepang</SelectItem>
                <SelectItem value="long_stay_local">Long Stay Lokal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tanggal CI & CO */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ci-date">Tanggal Masuk <span className="text-destructive">*</span></Label>
              <Input
                id="ci-date"
                type="date"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-date">Tanggal Keluar <span className="text-destructive">*</span></Label>
              <Input
                id="co-date"
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={e => setCheckOut(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Total Hari (readonly) */}
          <div className="space-y-1.5">
            <Label>Total Hari</Label>
            <Input
              value={totalDays > 0 ? `${totalDays} hari` : "—"}
              readOnly
              className="bg-muted/50 cursor-default"
            />
          </div>

          {/* Jumlah Penghuni */}
          <div className="space-y-1.5">
            <Label>
              Jumlah Penghuni
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                {"★".repeat(room.stars)} max {maxPersons} orang
              </span>
            </Label>
            <Select
              value={String(occupiedPersons)}
              onValueChange={v => setOccupiedPersons(parseInt(v))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxPersons }, (_, i) => i + 1).map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {n} orang
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <Label htmlFor="ci-notes">Catatan</Label>
            <Textarea
              id="ci-notes"
              placeholder="Catatan tambahan (opsional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Check-in Sekarang
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
