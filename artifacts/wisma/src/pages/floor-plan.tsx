import { useState, useMemo, useEffect, memo } from "react";
import { useGetRooms } from "@workspace/api-client-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BedDouble, CheckCircle2, User } from "lucide-react";
import type { Room } from "@workspace/api-client-react";
import CheckinDialog from "@/components/checkin-dialog";

// ─── Grid constants ─────────────────────────────────────────────
const SW  = 66;   // side col width
const CVW = 16;   // corridor col width
const NW  = 74;   // normal petak width
const RH  = 38;   // row height
const CHH = 22;   // corridor horizontal height
const SH  = 26;   // separator row height

const GCOLS = [SW, CVW, SW, ...Array(8).fill(NW)].map(x => `${x}px`).join(" ");
const GROWS = [
  `${RH}px`, `${CHH}px`, `${RH}px`,           // rows 1-3  Block A
  ...Array(9).fill(`${RH}px`),                  // rows 4-12 Block C
  `${SH}px`, `${SH}px`, `${SH}px`,             // rows 13-15 Separator lobby D
  ...Array(9).fill(`${RH}px`),                  // rows 16-24 Block D/E
  `${RH}px`, `${CHH}px`, `${RH}px`,            // rows 25-27 Block G
].join(" ");

// ─── Color helpers (outside component — pure functions) ─────────
function sbg(s: string) {
  if (s === "available")         return "#ffffff";
  if (s === "occupied_regular")  return "#fde68a";
  if (s === "long_stay_japan")   return "#f97316";
  if (s === "long_stay_local")   return "#3b82f6";
  if (s === "blocked")           return "#ef4444";
  return "#ffffff";
}
function sfg(s: string) {
  return ["long_stay_japan","long_stay_local","blocked"].includes(s) ? "#fff" : "#111827";
}

// ─── Cell components — defined OUTSIDE FloorPlan ────────────────
// (if defined inside, React treats them as new types on every render
//  which forces remount of every cell and breaks click handlers)

const LOBBY_BG    = "#e9ecef";
const FACILITY_BG = "#dee2e6";
const CORRIDOR_BG = "#f1f3f5";

type SelectFn = (room: Room) => void;

interface RCProps {
  n: string; room: Room | undefined;
  col: number; row: number; span?: number;
  onSelect: SelectFn;
}
const RoomCell = memo(({ n, room, col, row, span, onSelect }: RCProps) => {
  const colStr = span ? `${col} / ${col + span}` : String(col);
  return (
    <button
      onClick={() => room && onSelect(room)}
      style={{
        gridColumn: colStr, gridRow: String(row),
        display:"flex", alignItems:"center", justifyContent:"center",
        minWidth:0, minHeight:0, overflow:"hidden",
        background: room ? sbg(room.status) : "#ffffff",
        color: room ? sfg(room.status) : "#374151",
        cursor: room ? "pointer" : "default",
        flexDirection:"column", gap:1, padding:"0 2px",
        transition: "filter 0.1s",
      }}
      onMouseEnter={e => room && (e.currentTarget.style.filter = "brightness(0.92)")}
      onMouseLeave={e => (e.currentTarget.style.filter = "")}
    >
      <span style={{ fontWeight:800, fontSize:11, lineHeight:1 }}>{n}</span>
      {(room?.stars ?? 0) > 0 && (
        <span style={{ fontSize:8, lineHeight:1 }}>{"★".repeat(room!.stars)}</span>
      )}
    </button>
  );
});

interface FCProps { lbl: string; col: number; row: number; span?: number; }
const FacilityCell = memo(({ lbl, col, row, span }: FCProps) => {
  const colStr = span ? `${col} / ${col + span}` : String(col);
  return (
    <div style={{
      gridColumn: colStr, gridRow: String(row),
      display:"flex", alignItems:"center", justifyContent:"center",
      minWidth:0, minHeight:0, overflow:"hidden",
      background:FACILITY_BG, fontSize:9, fontWeight:700,
      color:"#374151", textAlign:"center", padding:"0 3px", lineHeight:1.2,
    }}>
      {lbl}
    </div>
  );
});

interface CVProps { col: number; r1: number; r2: number; lbl: string; }
const CorridorV = memo(({ col, r1, r2, lbl }: CVProps) => (
  <div style={{
    gridColumn: String(col), gridRow: `${r1} / ${r2+1}`,
    display:"flex", alignItems:"center", justifyContent:"center",
    minWidth:0, minHeight:0, background:CORRIDOR_BG,
  }}>
    <span style={{
      writingMode:"vertical-rl", transform:"rotate(180deg)",
      fontSize:8, color:"#6b7280", fontWeight:700, letterSpacing:2,
    }}>{lbl}</span>
  </div>
));

interface CHProps { c1: number; c2: number; row: number; lbl: string; }
const CorridorH = memo(({ c1, c2, row, lbl }: CHProps) => (
  <div style={{
    gridColumn: `${c1} / ${c2+1}`, gridRow: String(row),
    display:"flex", alignItems:"center", justifyContent:"center",
    minWidth:0, minHeight:0,
    background:CORRIDOR_BG, fontSize:9, fontWeight:700, color:"#6b7280", letterSpacing:1,
  }}>
    {lbl}
  </div>
));

interface LobbyProps { col: string; row: string; label: string; }
const LobbyBlock = memo(({ col, row, label }: LobbyProps) => (
  <div style={{
    gridColumn: col, gridRow: row,
    display:"flex", alignItems:"center", justifyContent:"center",
    minWidth:0, minHeight:0,
    background:LOBBY_BG, fontWeight:700, fontSize:12, color:"#374151",
    flexDirection:"column", gap:2,
  }}>
    <span style={{ fontSize:8, color:"#9ca3af" }}>◤</span>
    <span>{label}</span>
  </div>
));

// ─── Legend sub-components ──────────────────────────────────────
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
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:10, fontWeight:700, flexShrink:0,
      }}>{lbl}</div>
      <span style={{ fontSize:11, color:"#374151" }}>{desc}</span>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────
export default function FloorPlan() {
  const { data: rooms, isLoading, refetch } = useGetRooms();
  const [selected, setSelected] = useState<Room | null>(null);
  const [checkinOpen, setCheckinOpen] = useState(false);

  // Force fresh data every time the floor plan is opened
  useEffect(() => { refetch(); }, []);

  // O(1) lookup instead of .find() on every cell
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

  const typeLabel = (type: string) =>
    type === "single" ? "Single Bed (★)" : type === "family" ? "Family Room (★★)" : "Long Stay / Big Room (★★★)";

  const statusLabel = (s: string) => {
    if (s === "available")        return "Tersedia";
    if (s === "occupied_regular") return "Reguler";
    if (s === "long_stay_japan")  return "Long Stay Jepang";
    if (s === "long_stay_local")  return "Long Stay Lokal";
    if (s === "blocked")          return "Diblokir";
    return s;
  };

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

            {/* ══ LOBBY B — cols 1-3, rows 1-3 ══ */}
            <LobbyBlock col="1 / 4" row="1 / 4" label="Lobby B" />

            {/* ══ BLOCK A TOP (row 1) ══ */}
            {R("21", 4,  1)}
            {R("23", 5,  1, 2)}
            {R("27", 7,  1, 2)}
            {R("31", 9,  1, 2)}
            {R("33", 11, 1)}

            {/* ══ CORRIDOR A (row 2) ══ */}
            <CorridorH c1={4} c2={11} row={2} lbl="Coridor BLOK A" />

            {/* ══ BLOCK A BOTTOM (row 3) ══ */}
            {F("Kitchen", 4, 3)}
            {F("20i",     5, 3)}
            {R("22",      6, 3)}
            {R("24",      7, 3, 2)}
            {R("30",      9, 3, 2)}
            {F("Laundry", 11, 3)}

            {/* ══ BLOCK C HEADER (row 4) ══ */}
            {F("Storage", 1, 4)}
            {F("Pantry",  3, 4)}

            {/* ══ CORRIDOR C (col 2, rows 4-12) ══ */}
            <CorridorV col={2} r1={4} r2={12} lbl="Corridor C" />

            {/* ══ BLOCK C LEFT (col 1, rows 5-12) ══ */}
            {(["18","16","14","12","10","8","6","2"] as const).map((n, i) => R(n, 1, 5+i))}

            {/* ══ BLOCK C RIGHT (col 3, rows 5-12) ══ */}
            {(["19","17","15","11","7","5","3","1"] as const).map((n, i) => R(n, 3, 5+i))}

            {/* ══ LEGEND (cols 4-11, rows 4-24) ══ */}
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

            {/* ══ MAIN LOBBY D SEPARATOR (rows 13-15) ══ */}
            <div style={{ gridColumn:"1 / 3", gridRow:"13", background:"#ced4da" }} />
            {F("Office",  3, 13)}
            <div style={{
              gridColumn:"1 / 4", gridRow:"14",
              display:"flex", alignItems:"center",
              background:"#ced4da", fontSize:9, fontWeight:700, color:"#374151", paddingLeft:8,
            }}>
              ◀ Main Lobby Blok D
            </div>
            <div style={{ gridColumn:"1 / 3", gridRow:"15", background:"#ced4da" }} />
            {F("Storage", 3, 15)}

            {/* ══ CORRIDOR E (col 2, rows 16-24) ══ */}
            <CorridorV col={2} r1={16} r2={24} lbl="Corridor E" />

            {/* ══ BLOCK D/E LEFT (col 1, rows 16-24) ══ */}
            {(["34","36","38","40","42","44","46","48"] as const).map((n, i) => R(n, 1, 16+i))}
            {F("Panel Room", 1, 24)}

            {/* ══ BLOCK D/E RIGHT (col 3, rows 16-24) ══ */}
            {(["35","37","39","41","43","45","47","49"] as const).map((n, i) => R(n, 3, 16+i))}
            {F("Server MID", 3, 24)}

            {/* ══ LOBBY F — cols 1-3, rows 25-27 ══ */}
            <LobbyBlock col="1 / 4" row="25 / 28" label="Lobby Blok F" />

            {/* ══ BLOCK G TOP (row 25) ══ */}
            {F("Kitchen", 4,  25)}
            {R("50",      5,  25)}
            {R("52",      6,  25)}
            {R("54",      7,  25, 2)}
            {R("60",      9,  25, 2)}
            {F("Laundry", 11, 25)}

            {/* ══ CORRIDOR G (row 26) ══ */}
            <CorridorH c1={4} c2={11} row={26} lbl="Coridor Blok G" />

            {/* ══ BLOCK G BOTTOM (row 27) ══ */}
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
          onSuccess={() => {
            setCheckinOpen(false);
            setSelected(null);
            refetch();
          }}
        />
      )}

      {/* ── Room Detail Sheet ── */}
      <Sheet open={selected !== null} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-sm border-l shadow-2xl">
          {selected && (
            <div className="h-full flex flex-col">
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="text-2xl font-bold text-primary">Kamar {selected.number}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">Blok {selected.block}</Badge>
                      <BedDouble className="w-4 h-4" />
                      <span>{typeLabel(selected.type)}</span>
                    </SheetDescription>
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide mt-1 shrink-0"
                    style={{ background:sbg(selected.status), color:sfg(selected.status), border:"1px solid #6b7280" }}>
                    {statusLabel(selected.status)}
                  </div>
                </div>
              </SheetHeader>

              <div className="py-5 flex-1 overflow-auto space-y-4">
                {selected.status === "available" && (
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Kamar bersih dan siap untuk check-in.</span>
                  </div>
                )}
                {["occupied_regular","long_stay_japan","long_stay_local"].includes(selected.status) && (
                  <div className="rounded-lg border bg-card p-3 flex items-start gap-2 text-sm">
                    <User className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>Kamar sedang terisi. Buka menu <strong>Pemesanan</strong> untuk detail tamu.</span>
                  </div>
                )}
                {selected.status === "blocked" && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                    Kamar ini sedang diblokir.
                  </div>
                )}
                {selected.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Catatan</p>
                    <p className="text-sm bg-muted/40 rounded p-3 border">{selected.notes}</p>
                  </div>
                )}
                <div className="rounded-lg bg-muted/30 border p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blok</span>
                    <span className="font-medium">{selected.block}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipe</span>
                    <span className="font-medium">{"★".repeat(selected.stars)} — {typeLabel(selected.type)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                {selected.status === "available" && (
                  <Button size="lg" className="w-full" onClick={() => setCheckinOpen(true)}>
                    Check-in Tamu
                  </Button>
                )}
                {["occupied_regular","long_stay_japan","long_stay_local"].includes(selected.status) && (
                  <Button size="lg" variant="secondary" className="w-full">Check-out Tamu</Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">Edit Catatan</Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                    Block Kamar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
