import { useState, useMemo, useEffect, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetRooms, useGetRoom, getGetRoomsQueryKey } from "@workspace/api-client-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Room } from "@workspace/api-client-react";
import CheckinDialog from "@/components/checkin-dialog";
import { formatDate } from "@/lib/format";
import { getToken } from "@/lib/auth";
import {
  User, Building2, CalendarDays, CalendarOff, LogOut,
  UserCheck, Lock, Unlock, CheckCircle2, Loader2, Users,
  FileText, AlertTriangle,
} from "lucide-react";

// ─── Grid constants ─────────────────────────────────────────────
const SW  = 66;
const CVW = 16;
const NW  = 74;
const RH  = 38;
const CHH = 22;
const SH  = 26;

const GCOLS = [SW, CVW, SW, ...Array(8).fill(NW)].map(x => `${x}px`).join(" ");
const GROWS = [
  `${RH}px`, `${CHH}px`, `${RH}px`,
  ...Array(9).fill(`${RH}px`),
  `${SH}px`, `${SH}px`, `${SH}px`,
  ...Array(9).fill(`${RH}px`),
  `${RH}px`, `${CHH}px`, `${RH}px`,
].join(" ");

// ─── Color helpers ───────────────────────────────────────────────
function sbg(s: string) {
  if (s === "available")         return "#ffffff";
  if (s === "occupied_regular")  return "#fde68a";
  if (s === "long_stay_japan")   return "#f97316";
  if (s === "long_stay_local")   return "#3b82f6";
  if (s === "blocked")           return "#ef4444";
  if (s === "facility")          return "#dee2e6";
  return "#ffffff";
}
function sfg(s: string) {
  return ["long_stay_japan","long_stay_local","blocked"].includes(s) ? "#fff" : "#111827";
}
function statusLabel(s: string) {
  if (s === "available")        return "Tersedia";
  if (s === "occupied_regular") return "Reguler";
  if (s === "long_stay_japan")  return "Long Stay — Jepang";
  if (s === "long_stay_local")  return "Long Stay — Lokal";
  if (s === "blocked")          return "Diblokir";
  return s;
}
function typeLabel(t: string) {
  if (t === "single") return "Single Bed (★)";
  if (t === "family") return "Family Room (★★)";
  return "Long Stay / Big Room (★★★)";
}
function diffDays(from: string, to: string) {
  return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

// ─── Cell components (defined OUTSIDE main component) ───────────
const LOBBY_BG    = "#e9ecef";
const FACILITY_BG = "#dee2e6";
const CORRIDOR_BG = "#f1f3f5";

type SelectFn = (room: Room) => void;

interface RCProps { n: string; room: Room | undefined; col: number; row: number; span?: number; onSelect: SelectFn; }
const RoomCell = memo(({ n, room, col, row, span, onSelect }: RCProps) => {
  const isFacility = room?.status === "facility" || room?.is_facility;
  if (isFacility) {
    return (
      <div style={{
        gridColumn: span ? `${col} / ${col + span}` : String(col), gridRow: String(row),
        display:"flex", alignItems:"center", justifyContent:"center",
        minWidth:0, minHeight:0, overflow:"hidden",
        background: FACILITY_BG, fontSize:9, fontWeight:700, color:"#374151",
        textAlign:"center", padding:"0 3px", lineHeight:1.2,
      }}>
        {room?.room_name ?? n}
      </div>
    );
  }
  return (
    <button
      onClick={() => room && onSelect(room)}
      style={{
        gridColumn: span ? `${col} / ${col + span}` : String(col), gridRow: String(row),
        display:"flex", alignItems:"center", justifyContent:"center",
        minWidth:0, minHeight:0, overflow:"hidden",
        background: room ? sbg(room.status) : "#ffffff",
        color: room ? sfg(room.status) : "#374151",
        cursor: room ? "pointer" : "default",
        flexDirection:"column", gap:1, padding:"0 2px", transition:"filter 0.1s",
      }}
      onMouseEnter={e => room && (e.currentTarget.style.filter = "brightness(0.92)")}
      onMouseLeave={e => (e.currentTarget.style.filter = "")}
    >
      <span style={{ fontWeight:800, fontSize:11, lineHeight:1 }}>{n}</span>
      {(room?.stars ?? 0) > 0 && <span style={{ fontSize:8, lineHeight:1 }}>{"★".repeat(room!.stars)}</span>}
    </button>
  );
});

interface FCProps { lbl: string; col: number; row: number; span?: number; }
const FacilityCell = memo(({ lbl, col, row, span }: FCProps) => (
  <div style={{
    gridColumn: span ? `${col} / ${col + span}` : String(col), gridRow: String(row),
    display:"flex", alignItems:"center", justifyContent:"center",
    minWidth:0, minHeight:0, overflow:"hidden",
    background:FACILITY_BG, fontSize:9, fontWeight:700, color:"#374151",
    textAlign:"center", padding:"0 3px", lineHeight:1.2,
  }}>{lbl}</div>
));

interface CVProps { col: number; r1: number; r2: number; lbl: string; }
const CorridorV = memo(({ col, r1, r2, lbl }: CVProps) => (
  <div style={{
    gridColumn: String(col), gridRow: `${r1} / ${r2+1}`,
    display:"flex", alignItems:"center", justifyContent:"center",
    minWidth:0, minHeight:0, background:CORRIDOR_BG,
  }}>
    <span style={{ writingMode:"vertical-rl", transform:"rotate(180deg)", fontSize:8, color:"#6b7280", fontWeight:700, letterSpacing:2 }}>{lbl}</span>
  </div>
));

interface CHProps { c1: number; c2: number; row: number; lbl: string; }
const CorridorH = memo(({ c1, c2, row, lbl }: CHProps) => (
  <div style={{
    gridColumn: `${c1} / ${c2+1}`, gridRow: String(row),
    display:"flex", alignItems:"center", justifyContent:"center",
    minWidth:0, minHeight:0, background:CORRIDOR_BG, fontSize:9, fontWeight:700, color:"#6b7280", letterSpacing:1,
  }}>{lbl}</div>
));

interface LobbyProps { col: string; row: string; label: string; }
const LobbyBlock = memo(({ col, row, label }: LobbyProps) => (
  <div style={{
    gridColumn: col, gridRow: row,
    display:"flex", alignItems:"center", justifyContent:"center",
    minWidth:0, minHeight:0, background:LOBBY_BG, fontWeight:700, fontSize:12, color:"#374151",
    flexDirection:"column", gap:2,
  }}>
    <span style={{ fontSize:8, color:"#9ca3af" }}>◤</span>
    <span>{label}</span>
  </div>
));

// ─── Legend sub-components ───────────────────────────────────────
function LR({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width:44, height:18, background:color, border:"1px solid #9ca3af", flexShrink:0 }} />
      <span style={{ fontSize:11, color:"#374151" }}>{label}</span>
    </div>
  );
}
function TR({ lbl, desc }: { lbl: string; desc: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{
        width:44, height:18, background:"#bbf7d0", border:"1px solid #9ca3af",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, flexShrink:0,
      }}>{lbl}</div>
      <span style={{ fontSize:11, color:"#374151" }}>{desc}</span>
    </div>
  );
}

// ─── Room Detail Panel ───────────────────────────────────────────
function RoomDetailContent({
  room, onClose, onCheckin, onRefresh,
}: {
  room: Room;
  onClose: () => void;
  onCheckin: () => void;
  onRefresh: () => void;
}) {
  const qc = useQueryClient();
  const { data: detail, isLoading: loadingDetail } = useGetRoom(room.id);
  const booking = detail?.current_booking ?? null;

  const [checkoutConfirm, setCheckoutConfirm] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isOccupied = ["occupied_regular","long_stay_japan","long_stay_local"].includes(room.status);

  const totalDays  = booking ? diffDays(String(booking.check_in_date), String(booking.check_out_date)) : 0;
  const today      = new Date().toISOString().split("T")[0];
  const daysLeft   = booking ? diffDays(today, String(booking.check_out_date)) : 0;

  async function handleCheckout() {
    if (!booking) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const token = getToken();
      const resp = await fetch(`/api/bookings/${booking.id}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        setCheckoutError(d.error ?? "Gagal check-out");
        return;
      }
      await qc.invalidateQueries({ queryKey: getGetRoomsQueryKey() });
      onRefresh();
      onClose();
    } catch {
      setCheckoutError("Terjadi kesalahan jaringan.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Colored Header ── */}
      <div
        className="px-5 pt-5 pb-4 shrink-0"
        style={{ background: sbg(room.status), color: sfg(room.status) }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60 mb-0.5">
              {typeLabel(room.type)}
            </div>
            <div className="text-3xl font-black leading-tight">Kamar {room.number}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-medium opacity-70 flex-wrap">
              <span>Blok {room.block}</span>
              <span>·</span>
              <span>{"★".repeat(room.stars)}</span>
              {room.room_name && (
                <>
                  <span>·</span>
                  <span className="truncate">{room.room_name}</span>
                </>
              )}
            </div>
          </div>
          <div
            className="shrink-0 mt-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={{ background:"rgba(0,0,0,0.12)", color: sfg(room.status) }}
          >
            {statusLabel(room.status)}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* Available */}
        {room.status === "available" && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-center">
            <CheckCircle2 className="w-9 h-9 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-green-800">Kamar Tersedia</p>
            <p className="text-xs text-green-600 mt-1">Siap untuk check-in tamu baru</p>
          </div>
        )}

        {/* Blocked */}
        {room.status === "blocked" && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
              <Lock className="w-4 h-4" />
              Kamar Diblokir
            </div>
            <p className="text-xs text-red-600">Kamar tidak dapat digunakan sementara.</p>
          </div>
        )}

        {/* Occupied: Guest info */}
        {isOccupied && (
          loadingDetail ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Memuat info tamu…</span>
            </div>
          ) : booking ? (
            <div className="space-y-3">

              {/* Guest identity card */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-muted/40 border-b flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Info Tamu</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Nama</p>
                    <p className="font-bold text-base mt-0.5">{booking.guest_name}</p>
                  </div>
                  {booking.guest_company && (
                    <div>
                      <p className="text-xs text-muted-foreground">Perusahaan</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <p className="font-medium text-sm">{booking.guest_company}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates + counters card */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-muted/40 border-b flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Periode Menginap</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <CalendarDays className="w-3 h-3" /> Check-in
                      </div>
                      <p className="font-semibold text-sm">{formatDate(String(booking.check_in_date))}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <CalendarOff className="w-3 h-3" /> Check-out
                      </div>
                      <p className="font-semibold text-sm">{formatDate(String(booking.check_out_date))}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-black text-primary leading-none">{totalDays}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Total Hari</p>
                    </div>
                    <div className="text-center border-x">
                      <p className={`text-2xl font-black leading-none ${
                        daysLeft < 0 ? "text-destructive" : daysLeft <= 3 ? "text-orange-500" : "text-green-600"
                      }`}>
                        {Math.abs(daysLeft)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {daysLeft < 0 ? "Hari Lewat" : "Sisa Hari"}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <p className="text-2xl font-black leading-none">{booking.occupied_persons}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Penghuni</p>
                    </div>
                  </div>

                  {/* Overdue warning */}
                  {daysLeft < 0 && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Tanggal keluar sudah terlewat {Math.abs(daysLeft)} hari
                    </div>
                  )}

                  {/* Expiring soon */}
                  {daysLeft >= 0 && daysLeft <= 3 && (
                    <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-xs text-orange-700">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Akan check-out dalam {daysLeft} hari
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 border-b flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Catatan</span>
                  </div>
                  <p className="p-4 text-sm leading-relaxed">{booking.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-6">
              Data tamu tidak tersedia.
            </div>
          )
        )}

        {/* Room notes (when not occupied) */}
        {room.notes && !isOccupied && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">Catatan Kamar</p>
            <p className="text-sm">{room.notes}</p>
          </div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="p-4 border-t shrink-0 space-y-2 bg-background">

        {/* Check-in */}
        {room.status === "available" && (
          <Button className="w-full h-11 text-sm font-semibold" onClick={onCheckin}>
            <UserCheck className="w-4 h-4 mr-2" />
            Check-in Tamu
          </Button>
        )}

        {/* Check-out: normal button */}
        {isOccupied && !checkoutConfirm && (
          <Button
            variant="secondary"
            className="w-full h-11 text-sm font-semibold"
            onClick={() => setCheckoutConfirm(true)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Check-out Tamu
          </Button>
        )}

        {/* Check-out: confirmation */}
        {isOccupied && checkoutConfirm && (
          <div className="space-y-2">
            <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-800 text-center">
              Konfirmasi check-out <strong>{booking?.guest_name}</strong>?
            </div>
            {checkoutError && (
              <p className="text-xs text-destructive text-center">{checkoutError}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-9 text-sm"
                onClick={() => { setCheckoutConfirm(false); setCheckoutError(null); }}
                disabled={checkoutLoading}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                className="h-9 text-sm"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Ya, Check-out
              </Button>
            </div>
          </div>
        )}

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <FileText className="w-3 h-3 mr-1.5" />
            Edit Catatan
          </Button>
          {room.status === "blocked" ? (
            <Button variant="outline" size="sm" className="h-8 text-xs text-green-600 hover:bg-green-50">
              <Unlock className="w-3 h-3 mr-1.5" />
              Buka Blokir
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10">
              <Lock className="w-3 h-3 mr-1.5" />
              Blokir Kamar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────
export default function FloorPlan() {
  const { data: rooms, isLoading, refetch } = useGetRooms();
  const [selected, setSelected]   = useState<Room | null>(null);
  const [checkinOpen, setCheckinOpen] = useState(false);

  useEffect(() => { refetch(); }, []);

  const roomMap = useMemo(() => {
    const m = new Map<string, Room>();
    rooms?.forEach(r => m.set(r.number, r));
    return m;
  }, [rooms]);

  const R = (n: string, col: number, row: number, span?: number) => (
    <RoomCell key={n} n={n} room={roomMap.get(n)} col={col} row={row} span={span} onSelect={setSelected} />
  );
  const F = (lbl: string, col: number, row: number, span?: number) => (
    <FacilityCell key={`f-${lbl}-${row}`} lbl={lbl} col={col} row={row} span={span} />
  );

  if (isLoading && !rooms) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-primary">Denah Wisma Eucaliptus / Guest House Deluxe</h1>
          <p className="text-xs text-muted-foreground">Klik kamar untuk melihat detail & mengubah status</p>
        </div>
        <div className="flex gap-3 text-[11px] flex-wrap">
          {[
            { bg:"#ffffff", label:"Tersedia" },
            { bg:"#fde68a", label:"Reguler" },
            { bg:"#f97316", label:"Long Stay Jepang" },
            { bg:"#3b82f6", label:"Long Stay Lokal" },
            { bg:"#ef4444", label:"Diblokir" },
          ].map(({ bg, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div style={{ width:14, height:14, background:bg, border:"1px solid #6b7280", borderRadius:2 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Floor Plan Grid ── */}
      <div className="flex-1 overflow-auto">
        <div style={{ padding:16, background:"white", width:"fit-content", border:"1px solid #e5e7eb", borderRadius:8 }}>
          <div style={{
            display:"grid",
            gridTemplateColumns:GCOLS,
            gridTemplateRows:GROWS,
            gap:"1px",
            background:"#495057",
            border:"2px solid #495057",
          }}>
            <LobbyBlock col="1 / 4" row="1 / 4" label="Lobby B" />

            {R("21", 4,  1)}
            {R("23", 5,  1, 2)}
            {R("27", 7,  1, 2)}
            {R("31", 9,  1, 2)}
            {R("33", 11, 1)}

            <CorridorH c1={4} c2={11} row={2} lbl="Coridor BLOK A" />

            {F("Kitchen", 4, 3)}
            {F("Storage", 5, 3)}
            {R("22",      6, 3)}
            {R("24",      7, 3, 2)}
            {R("30",      9, 3, 2)}
            {F("Laundry", 11, 3)}

            {F("Storage", 1, 4)}
            {F("Pantry",  3, 4)}
            <CorridorV col={2} r1={4} r2={12} lbl="Corridor C" />

            {(["18","16","14","12","10","8","6","2"] as const).map((n, i) => R(n, 1, 5+i))}
            {(["19","17","15","11","7","5","3","1"] as const).map((n, i) => R(n, 3, 5+i))}

            <div style={{
              gridColumn:"4 / 12", gridRow:"4 / 25",
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              background:"white", gap:0, padding:28,
            }}>
              <p style={{ fontWeight:900, fontSize:18, color:"#374151", textAlign:"center", margin:0 }}>GUEST HOUSE DELUXE</p>
              <p style={{ fontWeight:900, fontSize:18, color:"#374151", textAlign:"center", marginTop:0, marginBottom:18 }}>BLOCK PLAN</p>
              <p style={{ fontWeight:700, fontSize:12, color:"#374151", marginBottom:10 }}>Note : 2026</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:18 }}>
                <LR color="#f97316" label="Long Stay  8 room***  Japan" />
                <LR color="#3b82f6" label="Long Stay  2 room***  Local" />
                <LR color="#60a5fa" label="Long Stay  2 room *   Local" />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <TR lbl="*"   desc="Double Bed (1-2 Person)" />
                <TR lbl="**"  desc="Family Room (1-3 person)" />
                <TR lbl="***" desc="Room Longstay / Big room" />
              </div>
            </div>

            <div style={{ gridColumn:"1 / 3", gridRow:"13", background:"#ced4da" }} />
            {F("Office",  3, 13)}
            <div style={{
              gridColumn:"1 / 4", gridRow:"14",
              display:"flex", alignItems:"center",
              background:"#ced4da", fontSize:9, fontWeight:700, color:"#374151", paddingLeft:8,
            }}>◀ Main Lobby Blok D</div>
            <div style={{ gridColumn:"1 / 3", gridRow:"15", background:"#ced4da" }} />
            {F("Storage", 3, 15)}

            <CorridorV col={2} r1={16} r2={24} lbl="Corridor E" />
            {(["34","36","38","40","42","44","46","48"] as const).map((n, i) => R(n, 1, 16+i))}
            {F("Panel Room", 1, 24)}
            {(["35","37","39","41","43","45","47","49"] as const).map((n, i) => R(n, 3, 16+i))}
            {F("Server MID", 3, 24)}

            <LobbyBlock col="1 / 4" row="25 / 28" label="Lobby Blok F" />

            {F("Kitchen", 4,  25)}
            {R("50",      5,  25)}
            {R("52",      6,  25)}
            {R("54",      7,  25, 2)}
            {R("60",      9,  25, 2)}
            {F("Laundry", 11, 25)}

            <CorridorH c1={4} c2={11} row={26} lbl="Coridor Blok G" />

            {R("51", 4,  27)}
            {R("53", 5,  27)}
            {R("55", 6,  27, 2)}
            {R("61", 8,  27, 2)}
            {R("62", 10, 27, 2)}
          </div>
        </div>
      </div>

      {/* ── Check-in Dialog ── */}
      {selected && (
        <CheckinDialog
          room={selected}
          open={checkinOpen}
          onOpenChange={setCheckinOpen}
          onSuccess={() => { setCheckinOpen(false); setSelected(null); refetch(); }}
        />
      )}

      {/* ── Room Detail Sheet ── */}
      <Sheet open={selected !== null} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-sm p-0 border-l shadow-2xl flex flex-col [&>button]:top-4 [&>button]:right-4">
          {selected && (
            <RoomDetailContent
              room={selected}
              onClose={() => setSelected(null)}
              onCheckin={() => setCheckinOpen(true)}
              onRefresh={() => refetch()}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
