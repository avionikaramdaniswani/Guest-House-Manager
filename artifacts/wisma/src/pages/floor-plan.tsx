import { useState, useMemo, useEffect, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetRooms, useGetRoom, getGetRoomsQueryKey } from "@workspace/api-client-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import type { Room } from "@workspace/api-client-react";
import CheckinDialog from "@/components/checkin-dialog";
import { formatDate } from "@/lib/format";
import { getToken } from "@/lib/auth";
import {
  User, Building2, CalendarDays, CalendarOff, LogOut,
  UserCheck, Lock, Unlock, CheckCircle2, Loader2, Users,
  FileText, AlertTriangle, ArrowLeftRight,
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

// ─── Room designation (fixed per property) ───────────────────────
const JAPAN_LONGSTAY_ROOMS = new Set(["23","24","27","30","31","54","55","60"]);
const LOCAL_LONGSTAY_ROOMS = new Set(["61","62"]);
const LOCAL_SINGLE_ROOMS   = new Set(["51","53"]);

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
function roomBg(status: string, number: string) {
  if (status !== "available") return sbg(status);
  if (JAPAN_LONGSTAY_ROOMS.has(number)) return "#f97316";
  if (LOCAL_LONGSTAY_ROOMS.has(number)) return "#3b82f6";
  if (LOCAL_SINGLE_ROOMS.has(number))   return "#60a5fa";
  return "#ffffff";
}
function roomFg(status: string, number: string) {
  if (status !== "available") return sfg(status);
  if (JAPAN_LONGSTAY_ROOMS.has(number) || LOCAL_LONGSTAY_ROOMS.has(number) || LOCAL_SINGLE_ROOMS.has(number)) return "#fff";
  return "#111827";
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
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
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
        background: room ? roomBg(room.status, room.number) : "#ffffff",
        color: room ? roomFg(room.status, room.number) : "#374151",
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

// ─── Panel helpers ────────────────────────────────────────────────
const S = { /* shared inline style tokens */
  labelSm: { fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#9ca3af" },
  sectionTitle: { fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.1em", color:"#9ca3af", padding:"14px 18px 6px" },
  divider: { height:1, background:"#f3f4f6", margin:"0 18px" },
};

function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={S.sectionTitle}>{label}</div>
      <div style={{ padding:"4px 18px 14px" }}>{children}</div>
    </div>
  );
}

function PanelDivider() {
  return <div style={S.divider} />;
}

function InfoRow({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"4px 0", gap:12 }}>
      <span style={{ fontSize:12, color:"#9ca3af", flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, color: muted ? "#9ca3af" : "#111827", textAlign:"right" }}>{value}</span>
    </div>
  );
}

function PanelAlert({ type, children }: { type: "error" | "warn" | "info"; children: React.ReactNode }) {
  const styles = {
    error: { bg:"#fef2f2", border:"#fecaca", color:"#991b1b" },
    warn:  { bg:"#fffbeb", border:"#fde68a", color:"#92400e" },
    info:  { bg:"#eff6ff", border:"#bfdbfe", color:"#1e40af" },
  }[type];
  return (
    <div style={{ background:styles.bg, border:`1px solid ${styles.border}`, borderRadius:6, padding:"7px 12px", marginTop:10, fontSize:12, color:styles.color, display:"flex", alignItems:"flex-start", gap:6 }}>
      <AlertTriangle style={{ width:13, height:13, flexShrink:0, marginTop:1 }} />
      <span>{children}</span>
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
  const { data: allRooms } = useGetRooms();
  const booking = detail?.current_booking ?? null;

  const [checkoutConfirm, setCheckoutConfirm] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError]     = useState<string | null>(null);

  const [panelMode, setPanelMode]   = useState<"default" | "extend" | "move">("default");
  const [extendDate, setExtendDate] = useState<string>("");
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendError, setExtendError]     = useState<string | null>(null);
  const [moveRoomId, setMoveRoomId] = useState<number | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError]     = useState<string | null>(null);

  const availableRooms = (allRooms ?? []).filter(r => r.status === "available" && !r.is_facility && r.id !== room.id);

  const isOccupied = ["occupied_regular","long_stay_japan","long_stay_local"].includes(room.status);

  const today        = new Date().toISOString().split("T")[0];
  const totalNights  = booking ? diffDays(String(booking.check_in_date), String(booking.check_out_date)) : 0;
  const nightsStayed = booking ? Math.min(totalNights, Math.max(1, diffDays(String(booking.check_in_date), today))) : 0;
  const daysLeft     = booking ? diffDays(today, String(booking.check_out_date)) : 0;

  const designation =
    JAPAN_LONGSTAY_ROOMS.has(room.number) ? { label:"Long Stay — Jepang", color:"#f97316" } :
    LOCAL_LONGSTAY_ROOMS.has(room.number) ? { label:"Long Stay — Lokal",  color:"#3b82f6" } :
    LOCAL_SINGLE_ROOMS.has(room.number)   ? { label:"Kamar Lokal (★)",    color:"#60a5fa" } :
    null;

  const headerBg  = roomBg(room.status, room.number);
  const headerFg  = roomFg(room.status, room.number);
  const isWhiteBg = headerBg === "#ffffff";

  async function handleCheckout() {
    if (!booking) return;
    setCheckoutLoading(true); setCheckoutError(null);
    try {
      const token = getToken();
      const resp = await fetch(`/api/bookings/${booking.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({}),
      });
      if (!resp.ok) { const d = await resp.json().catch(() => ({})); setCheckoutError(d.error ?? "Gagal check-out"); return; }
      await qc.invalidateQueries({ queryKey: getGetRoomsQueryKey() });
      onRefresh(); onClose();
    } catch { setCheckoutError("Terjadi kesalahan jaringan."); }
    finally { setCheckoutLoading(false); }
  }

  async function handleExtend() {
    if (!booking || !extendDate) return;
    setExtendLoading(true); setExtendError(null);
    try {
      const token = getToken();
      const resp = await fetch(`/api/bookings/${booking.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ new_check_out_date: extendDate }),
      });
      if (!resp.ok) { const d = await resp.json().catch(() => ({})); setExtendError(d.error ?? "Gagal memperpanjang"); return; }
      await qc.invalidateQueries({ queryKey: getGetRoomsQueryKey() });
      onRefresh(); setPanelMode("default");
    } catch { setExtendError("Terjadi kesalahan jaringan."); }
    finally { setExtendLoading(false); }
  }

  async function handleMove() {
    if (!booking || !moveRoomId) return;
    setMoveLoading(true); setMoveError(null);
    try {
      const token = getToken();
      const resp = await fetch(`/api/bookings/${booking.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ new_room_id: moveRoomId }),
      });
      if (!resp.ok) { const d = await resp.json().catch(() => ({})); setMoveError(d.error ?? "Gagal memindahkan kamar"); return; }
      await qc.invalidateQueries({ queryKey: getGetRoomsQueryKey() });
      onRefresh(); onClose();
    } catch { setMoveError("Terjadi kesalahan jaringan."); }
    finally { setMoveLoading(false); }
  }

  function enterExtend() {
    const base = booking?.check_out_date ? String(booking.check_out_date) : today;
    setExtendDate(addDays(base, 7));
    setExtendError(null);
    setPanelMode("extend");
  }

  function enterMove() {
    setMoveRoomId(null);
    setMoveError(null);
    setPanelMode("move");
  }

  const selectedMoveRoom = moveRoomId ? allRooms?.find(r => r.id === moveRoomId) : null;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden", background:"#fff" }}>

      {/* ── Header ── */}
      <div style={{ background:headerBg, color:headerFg, padding:"16px 18px 14px", flexShrink:0, borderBottom: isWhiteBg ? "1px solid #f3f4f6" : "none" }}>
        {panelMode !== "default" && (
          <button onClick={() => setPanelMode("default")} style={{
            fontSize:11, color: isWhiteBg ? "#6b7280" : "rgba(255,255,255,0.72)",
            background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:8,
            display:"flex", alignItems:"center", gap:4,
          }}>
            ← Kembali
          </button>
        )}
        <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", opacity:0.65, marginBottom:6 }}>
          Blok {room.block} · {"★".repeat(room.stars)} · {typeLabel(room.type)}
        </div>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:8 }}>
          <div>
            <div style={{ fontSize:32, fontWeight:900, lineHeight:1, letterSpacing:"-0.02em" }}>
              Kamar {room.number}
            </div>
            {panelMode === "default" && designation && room.status === "available" && (
              <div style={{ fontSize:11, fontWeight:600, marginTop:5, opacity:0.8 }}>{designation.label}</div>
            )}
            {panelMode === "extend" && (
              <div style={{ fontSize:12, fontWeight:600, marginTop:4, opacity:0.8 }}>Perpanjang Menginap</div>
            )}
            {panelMode === "move" && (
              <div style={{ fontSize:12, fontWeight:600, marginTop:4, opacity:0.8 }}>Pindah Kamar</div>
            )}
          </div>
          <div style={{
            fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em",
            background: isWhiteBg ? "#f3f4f6" : "rgba(0,0,0,0.18)",
            color: isWhiteBg ? "#374151" : headerFg,
            padding:"4px 10px", borderRadius:20, marginBottom:2, whiteSpace:"nowrap",
          }}>
            {statusLabel(room.status)}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, overflowY:"auto" }}>

        {/* ─── DEFAULT ─────────────────────────────────────────── */}
        {panelMode === "default" && (
          <>
            {room.status === "available" && (
              <>
                <PanelSection label="Status Kamar">
                  <div style={{ fontSize:13, color:"#6b7280", paddingTop:4 }}>
                    Kamar kosong — siap untuk check-in tamu baru.
                  </div>
                  {room.notes && (
                    <div style={{ marginTop:10, background:"#f9fafb", borderRadius:6, padding:"8px 12px", fontSize:13, color:"#374151" }}>
                      {room.notes}
                    </div>
                  )}
                </PanelSection>
                {designation && (
                  <>
                    <PanelDivider />
                    <PanelSection label="Peruntukan">
                      <div style={{ display:"flex", alignItems:"center", gap:8, paddingTop:4 }}>
                        <div style={{ width:12, height:12, borderRadius:2, background:designation.color, flexShrink:0 }} />
                        <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{designation.label}</span>
                      </div>
                    </PanelSection>
                  </>
                )}
              </>
            )}

            {room.status === "blocked" && (
              <PanelSection label="Status Kamar">
                <div style={{ fontSize:13, color:"#6b7280", paddingTop:4 }}>
                  Kamar tidak dapat digunakan sementara.
                </div>
                {room.notes && (
                  <div style={{ marginTop:10, background:"#f9fafb", borderRadius:6, padding:"8px 12px", fontSize:13, color:"#374151" }}>
                    {room.notes}
                  </div>
                )}
              </PanelSection>
            )}

            {isOccupied && (
              loadingDetail ? (
                <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"48px 0", color:"#9ca3af" }}>
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : booking ? (
                <>
                  <PanelSection label="Tamu">
                    <div style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:8, lineHeight:1.2 }}>
                      {booking.guest_name}
                    </div>
                    {booking.guest_company && <InfoRow label="Perusahaan" value={booking.guest_company} />}
                    <InfoRow label="Tipe stay" value={
                      booking.stay_type === "long_stay_japan" ? "Long Stay — Jepang" :
                      booking.stay_type === "long_stay_local" ? "Long Stay — Lokal" : "Reguler"
                    } />
                    <InfoRow label="Jumlah tamu" value={`${booking.occupied_persons} orang`} />
                  </PanelSection>

                  <PanelDivider />

                  <PanelSection label="Menginap">
                    <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:8, marginBottom:14 }}>
                      <div>
                        <div style={S.labelSm}>Check-in</div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#111827", marginTop:3 }}>
                          {formatDate(String(booking.check_in_date))}
                        </div>
                      </div>
                      <div style={{ fontSize:14, color:"#d1d5db", fontWeight:300 }}>→</div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ ...S.labelSm, textAlign:"right" }}>Check-out</div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#111827", marginTop:3 }}>
                          {formatDate(String(booking.check_out_date))}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display:"grid", gridTemplateColumns:"repeat(3,1fr)",
                      background:"#f9fafb", border:"1px solid #f3f4f6", borderRadius:8,
                      textAlign:"center", overflow:"hidden",
                    }}>
                      <div style={{ padding:"12px 0" }}>
                        <div style={{ fontSize:26, fontWeight:900, color:"#374151", lineHeight:1 }}>{nightsStayed}</div>
                        <div style={{ fontSize:10, color:"#9ca3af", marginTop:5 }}>Malam ke</div>
                      </div>
                      <div style={{ padding:"12px 0", borderLeft:"1px solid #e5e7eb", borderRight:"1px solid #e5e7eb" }}>
                        <div style={{
                          fontSize:26, fontWeight:900, lineHeight:1,
                          color: daysLeft < 0 ? "#ef4444" : daysLeft === 0 ? "#f97316" : daysLeft <= 3 ? "#eab308" : "#22c55e",
                        }}>
                          {Math.abs(daysLeft)}
                        </div>
                        <div style={{ fontSize:10, color:"#9ca3af", marginTop:5 }}>
                          {daysLeft < 0 ? "Hari lewat" : "Sisa hari"}
                        </div>
                      </div>
                      <div style={{ padding:"12px 0" }}>
                        <div style={{ fontSize:26, fontWeight:900, color:"#374151", lineHeight:1 }}>{totalNights}</div>
                        <div style={{ fontSize:10, color:"#9ca3af", marginTop:5 }}>Total malam</div>
                      </div>
                    </div>

                    {daysLeft < 0 && <PanelAlert type="error">Lewat {Math.abs(daysLeft)} hari dari jadwal check-out</PanelAlert>}
                    {daysLeft === 0 && <PanelAlert type="warn">Check-out hari ini</PanelAlert>}
                    {daysLeft > 0 && daysLeft <= 3 && <PanelAlert type="warn">Akan check-out dalam {daysLeft} hari</PanelAlert>}
                  </PanelSection>

                  {booking.notes && (
                    <>
                      <PanelDivider />
                      <PanelSection label="Catatan">
                        <div style={{ fontSize:13, color:"#374151", lineHeight:1.65 }}>{booking.notes}</div>
                      </PanelSection>
                    </>
                  )}
                </>
              ) : (
                <div style={{ padding:"20px 18px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>
                  Data tamu tidak tersedia.
                </div>
              )
            )}
          </>
        )}

        {/* ─── EXTEND ──────────────────────────────────────────── */}
        {panelMode === "extend" && (
          <div style={{ padding:"18px 18px 0" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:8, marginBottom:20 }}>
              <div>
                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:4, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Sekarang</div>
                <div style={{ fontSize:15, fontWeight:700, color:"#374151" }}>
                  {booking ? formatDate(String(booking.check_out_date)) : "—"}
                </div>
              </div>
              <ArrowLeftRight style={{ width:15, height:15, color:"#d1d5db" }} />
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:4, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Checkout baru</div>
                <div style={{ fontSize:15, fontWeight:700, color: extendDate ? "#0C447C" : "#d1d5db" }}>
                  {extendDate ? formatDate(extendDate) : "—"}
                </div>
              </div>
            </div>
            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:6 }}>Tanggal check-out baru</div>
            <input
              type="date"
              value={extendDate}
              min={booking ? addDays(String(booking.check_out_date), 1) : ""}
              onChange={e => setExtendDate(e.target.value)}
              style={{
                width:"100%", padding:"10px 12px", fontSize:14, fontWeight:600,
                border:"1.5px solid #e5e7eb", borderRadius:8, outline:"none",
                color:"#111827", background:"#fff", boxSizing:"border-box",
              }}
            />
            {extendError && <p style={{ fontSize:12, color:"#ef4444", marginTop:10 }}>{extendError}</p>}
          </div>
        )}

        {/* ─── MOVE ────────────────────────────────────────────── */}
        {panelMode === "move" && (
          <div>
            <div style={{ padding:"14px 18px 6px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#9ca3af" }}>
              Pilih Kamar Tujuan
            </div>
            {moveError && <div style={{ margin:"0 18px 8px", fontSize:12, color:"#ef4444" }}>{moveError}</div>}
            {availableRooms.length === 0 ? (
              <div style={{ padding:"32px 18px", color:"#9ca3af", fontSize:13, textAlign:"center" }}>
                Tidak ada kamar tersedia saat ini.
              </div>
            ) : availableRooms.map(r => {
              const des = JAPAN_LONGSTAY_ROOMS.has(r.number) ? { label:"Jepang", color:"#f97316" }
                : LOCAL_LONGSTAY_ROOMS.has(r.number) ? { label:"Lokal", color:"#3b82f6" }
                : LOCAL_SINGLE_ROOMS.has(r.number)   ? { label:"Lokal ★", color:"#60a5fa" }
                : null;
              const isSel = moveRoomId === r.id;
              return (
                <button key={r.id} onClick={() => setMoveRoomId(isSel ? null : r.id)} style={{
                  display:"flex", alignItems:"center", gap:12, padding:"10px 18px",
                  width:"100%", textAlign:"left", border:"none",
                  borderBottom:"1px solid #f3f4f6",
                  background: isSel ? "#eff6ff" : "#fff", cursor:"pointer",
                }}>
                  <div style={{
                    width:38, height:38, borderRadius:6,
                    background: isSel ? "#0C447C" : "#f3f4f6",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:800, fontSize:13,
                    color: isSel ? "#fff" : "#374151", flexShrink:0,
                  }}>
                    {r.number}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>
                      Kamar {r.number}
                      <span style={{ fontWeight:400, fontSize:11, color:"#9ca3af", marginLeft:6 }}>Blok {r.block}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>
                      {"★".repeat(r.stars)} · {typeLabel(r.type)}
                      {des && <span style={{ marginLeft:8, color:des.color, fontWeight:600 }}>{des.label}</span>}
                    </div>
                  </div>
                  {isSel && <CheckCircle2 style={{ width:16, height:16, color:"#0C447C", flexShrink:0 }} />}
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Action Buttons ── */}
      <div style={{ padding:"12px 16px 16px", borderTop:"1px solid #f3f4f6", flexShrink:0, background:"#fff" }}>

        {/* ─── DEFAULT ── */}
        {panelMode === "default" && (
          <>
            {room.status === "available" && (
              <Button className="w-full h-10 text-sm font-semibold mb-2" onClick={onCheckin}>
                <UserCheck className="w-4 h-4 mr-2" />Check-in Tamu
              </Button>
            )}

            {isOccupied && !checkoutConfirm && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Button variant="outline" className="h-9 text-xs font-semibold" onClick={enterExtend}>
                  <CalendarDays className="w-3.5 h-3.5 mr-1.5" />Perpanjang
                </Button>
                <Button variant="outline" className="h-9 text-xs font-semibold" onClick={enterMove}>
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />Pindah Kamar
                </Button>
              </div>
            )}

            {isOccupied && !checkoutConfirm && (
              <Button variant="secondary" className="w-full h-10 text-sm font-semibold mb-2" onClick={() => setCheckoutConfirm(true)}>
                <LogOut className="w-4 h-4 mr-2" />Check-out
              </Button>
            )}

            {isOccupied && checkoutConfirm && (
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:12, color:"#92400e", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:6, padding:"6px 12px", textAlign:"center", marginBottom:8 }}>
                  Konfirmasi check-out <strong>{booking?.guest_name}</strong>?
                </div>
                {checkoutError && <p style={{ fontSize:12, color:"#ef4444", textAlign:"center", marginBottom:6 }}>{checkoutError}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-9 text-sm"
                    onClick={() => { setCheckoutConfirm(false); setCheckoutError(null); }}
                    disabled={checkoutLoading}>Batal</Button>
                  <Button variant="destructive" className="h-9 text-sm"
                    onClick={handleCheckout} disabled={checkoutLoading}>
                    {checkoutLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Ya, Check-out
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <FileText className="w-3 h-3 mr-1.5" />Edit Catatan
              </Button>
              {room.status === "blocked" ? (
                <Button variant="outline" size="sm" className="h-8 text-xs text-green-600 hover:bg-green-50">
                  <Unlock className="w-3 h-3 mr-1.5" />Buka Blokir
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10">
                  <Lock className="w-3 h-3 mr-1.5" />Blokir Kamar
                </Button>
              )}
            </div>
          </>
        )}

        {/* ─── EXTEND ── */}
        {panelMode === "extend" && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-10 text-sm"
              onClick={() => setPanelMode("default")} disabled={extendLoading}>
              Batal
            </Button>
            <Button className="h-10 text-sm font-semibold"
              onClick={handleExtend} disabled={extendLoading || !extendDate}>
              {extendLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Konfirmasi
            </Button>
          </div>
        )}

        {/* ─── MOVE ── */}
        {panelMode === "move" && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-10 text-sm"
              onClick={() => setPanelMode("default")} disabled={moveLoading}>
              Batal
            </Button>
            <Button className="h-10 text-sm font-semibold"
              onClick={handleMove} disabled={moveLoading || !moveRoomId}>
              {moveLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {selectedMoveRoom ? `Pindah ke ${selectedMoveRoom.number}` : "Pilih Kamar"}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────
export default function FloorPlan() {
  const { data: rooms, isLoading, isError, refetch } = useGetRooms();
  const [selected, setSelected]   = useState<Room | null>(null);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const isMobile = useIsMobile();

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

  if (isError && !rooms) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-muted-foreground">Gagal memuat data kamar. Server mungkin sedang restart.</p>
        <button
          onClick={() => refetch()}
          className="text-sm text-primary underline cursor-pointer"
        >
          Coba lagi
        </button>
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
            { bg:"#f97316", label:"Long Stay Jepang (★★★)" },
            { bg:"#3b82f6", label:"Long Stay Lokal (★★★)" },
            { bg:"#60a5fa", label:"Lokal (★)" },
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
            {F("Storage", 11, 1)}

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

      {/* ── Room Detail: side panel on desktop, bottom sheet on mobile ── */}
      {isMobile ? (
        <Drawer open={selected !== null} onOpenChange={open => !open && setSelected(null)}>
          <DrawerContent className="max-h-[88vh] flex flex-col p-0">
            {selected && (
              <div className="flex flex-col overflow-hidden flex-1 min-h-0">
                <RoomDetailContent
                  room={selected}
                  onClose={() => setSelected(null)}
                  onCheckin={() => setCheckinOpen(true)}
                  onRefresh={() => refetch()}
                />
              </div>
            )}
          </DrawerContent>
        </Drawer>
      ) : (
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
      )}
    </div>
  );
}
