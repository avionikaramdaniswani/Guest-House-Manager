import { useState } from "react";
import { useGetRooms } from "@workspace/api-client-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BedDouble, CheckCircle2, User } from "lucide-react";
import type { Room } from "@workspace/api-client-react";

// ─── Grid layout ───────────────────────────────────────────────
//
// 11 COLUMNS:
//   col 1   = SW   — Block C/E left  (Storage/rooms)
//   col 2   = CVW  — Corridor C / E  (vertical label)
//   col 3   = SW   — Block C/E right (Pantry/rooms)
//   col 4–11= NW×8 — Block A / G     (8 petaks)
//
// 27 ROWS:
//   1        Block A top rooms
//   2        Corridor BLOK A
//   3        Block A bottom rooms  (Kitchen, 20i, 22, 24, 30, Laundry)
//             ↑ cols 1-3 = LOBBY B (same as Lobby F covers all of Block G)
//   4        Block C header row   (Storage | Corr-C top | Pantry)
//   5–12     Block C room rows    (8 rooms each side)
//   13       Block C footer row   (blank | Corr-C bot | Office)
//   14       Separator / Main Lobby Blok D
//   15–24    Block D/E            (Storage | Corr-E | rooms)
//   25       Block G top rooms
//   26       Corridor Blok G
//   27       Block G bottom rooms
//
// Block A/G petak mapping (cols 4–11):
//   Top    : 21*(1) | 23***(2-3) | 27***(4-5) | 31***(6-7) | 33(8)
//   Corr A : ←──────────────────────────────────────────────────→
//   Bottom : Kitchen(1) | 20i(2) | 22**(3) | 24***(4-5) | 30***(6-7) | Laundry(8)

const SW   = 66;
const CVW  = 16;
const NW   = 74;
const RH   = 38;
const CHH  = 22;
const SEPH = 28;

const GCOLS = [SW, CVW, SW, ...Array(8).fill(NW)].map(x => `${x}px`).join(" ");

const SH = 26; // separator row height

const GROWS = [
  /* 1    */ `${RH}px`,
  /* 2    */ `${CHH}px`,
  /* 3    */ `${RH}px`,
  /* 4-12 */ ...Array(9).fill(`${RH}px`),   // Block C (header + 8 rooms)
  /* 13   */ `${SH}px`,                       // separator row 1: Lobby + Office
  /* 14   */ `${SH}px`,                       // separator row 2: Lobby full (label)
  /* 15   */ `${SH}px`,                       // separator row 3: Lobby + Storage
  /* 16-24*/ ...Array(9).fill(`${RH}px`),   // Block D/E (9 rooms)
  /* 25   */ `${RH}px`,
  /* 26   */ `${CHH}px`,
  /* 27   */ `${RH}px`,
].join(" ");

// ─── Status colors ─────────────────────────────────────────────
function sbg(s: string) {
  if (s === "available")         return "#ffffff";
  if (s === "occupied_regular")  return "#fde68a";
  if (s === "long_stay_japan")   return "#f97316";
  if (s === "long_stay_local")   return "#3b82f6";
  if (s === "blocked")           return "#ef4444";
  return "#ffffff";
}
function sfg(s: string) {
  return ["long_stay_japan","long_stay_local","blocked"].includes(s)
    ? "#fff" : "#111827";
}

// ─── Legend helpers ────────────────────────────────────────────
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

// ─── Cell helpers ──────────────────────────────────────────────
function cs(col: string, row: string, extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    gridColumn:col, gridRow:row,
    display:"flex", alignItems:"center", justifyContent:"center",
    minWidth:0, minHeight:0, overflow:"hidden",
    ...extra,
  };
}

const LOBBY_BG    = "#e9ecef";
const FACILITY_BG = "#dee2e6";
const CORRIDOR_BG = "#f1f3f5";

// ─── Component ─────────────────────────────────────────────────
export default function FloorPlan() {
  const { data: rooms, isLoading } = useGetRooms();
  const [selected, setSelected] = useState<Room | null>(null);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  const gr = (n: string) => rooms?.find(r => r.number === n);

  // Room cell — span=2 for double-wide (***) rooms
  const RC = ({ n, col, row, span }: { n:string; col:number; row:number; span?:number }) => {
    const room = gr(n);
    const colStr = span ? `${col} / ${col + span}` : String(col);
    return (
      <button
        onClick={() => room && setSelected(room)}
        style={cs(colStr, String(row), {
          background: room ? sbg(room.status) : "#ffffff",
          color: room ? sfg(room.status) : "#374151",
          cursor: room ? "pointer" : "default",
          flexDirection:"column", gap:1, padding:"0 2px",
        })}
      >
        <span style={{ fontWeight:800, fontSize:11, lineHeight:1 }}>{n}</span>
        {(room?.stars ?? 0) > 0 && (
          <span style={{ fontSize:8, lineHeight:1 }}>{"★".repeat(room!.stars)}</span>
        )}
      </button>
    );
  };

  // Facility label cell
  const FC = ({ lbl, col, row, span }: { lbl:string; col:number; row:number; span?:number }) => {
    const colStr = span ? `${col} / ${col + span}` : String(col);
    return (
      <div style={cs(colStr, String(row), {
        background:FACILITY_BG, fontSize:9, fontWeight:700,
        color:"#374151", textAlign:"center", padding:"0 3px", lineHeight:1.2,
      })}>
        {lbl}
      </div>
    );
  };

  // Vertical corridor label
  const CV = ({ col, r1, r2, lbl }: { col:number; r1:number; r2:number; lbl:string }) => (
    <div style={cs(String(col), `${r1} / ${r2+1}`, { background:CORRIDOR_BG })}>
      <span style={{
        writingMode:"vertical-rl", transform:"rotate(180deg)",
        fontSize:8, color:"#6b7280", fontWeight:700, letterSpacing:2,
      }}>{lbl}</span>
    </div>
  );

  // Horizontal corridor label
  const CH = ({ c1, c2, row, lbl }: { c1:number; c2:number; row:number; lbl:string }) => (
    <div style={cs(`${c1} / ${c2+1}`, String(row), {
      background:CORRIDOR_BG, fontSize:9, fontWeight:700, color:"#6b7280", letterSpacing:1,
    })}>
      {lbl}
    </div>
  );

  // Lobby block
  const Lobby = ({ col, row, label }: { col:string; row:string; label:string }) => (
    <div style={cs(col, row, {
      background:LOBBY_BG, fontWeight:700, fontSize:12, color:"#374151",
      flexDirection:"column", gap:2,
    })}>
      <span style={{ fontSize:8, color:"#9ca3af" }}>◤</span>
      <span>{label}</span>
    </div>
  );

  const starsLabel = (n:number) =>
    n===1 ? "Double Bed (★)" : n===2 ? "Family Room (★★)" : "Longstay / Big Room (★★★)";

  return (
    <div className="space-y-3 h-full flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-primary">Denah Wisma Eucaliptus / Guest House Deluxe</h1>
          <p className="text-xs text-muted-foreground">Klik kamar untuk detail · check-in · check-out</p>
        </div>
        <div className="flex gap-3 text-[11px] flex-wrap">
          {[
            { bg:"#ffffff", label:"Tersedia" },
            { bg:"#fde68a", label:"Reguler" },
            { bg:"#f97316", label:"Long Stay Japan" },
            { bg:"#3b82f6", label:"Long Stay Lokal" },
            { bg:"#ef4444", label:"Blocked" },
          ].map(({ bg, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div style={{ width:14, height:14, background:bg, border:"1px solid #6b7280", borderRadius:2 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Floor Plan ── */}
      <div className="flex-1 overflow-auto">
        <div style={{ padding:16, background:"white", width:"fit-content", border:"1px solid #e5e7eb", borderRadius:8 }}>

          {/*
            LOBBY B spans cols 1-3, rows 1-3 (all of Block A left side),
            mirroring how LOBBY F spans cols 1-3, rows 25-27 (all of Block G left side).
            Block C (Storage/Pantry/Corridor C/rooms) starts at row 4.
          */}
          <div style={{
            display:"grid",
            gridTemplateColumns:GCOLS,
            gridTemplateRows:GROWS,
            gap:"1px",
            background:"#495057",
            border:"2px solid #495057",
          }}>

            {/* ══ LOBBY B — cols 1-3, rows 1-3 (full Block A height) ══ */}
            <Lobby col="1 / 4" row="1 / 4" label="Lobby B" />

            {/* ══ BLOCK A TOP ROW (row 1) ══
                petak1=col4 | petak2-3=col5-6 | petak4-5=col7-8 | petak6-7=col9-10 | petak8=col11 */}
            <RC n="21" col={4}  row={1} />
            <RC n="23" col={5}  row={1} span={2} />
            <RC n="27" col={7}  row={1} span={2} />
            <RC n="31" col={9}  row={1} span={2} />
            <RC n="33" col={11} row={1} />

            {/* ══ CORRIDOR A (row 2) ══ */}
            <CH c1={4} c2={11} row={2} lbl="Coridor BLOK A" />

            {/* ══ BLOCK A BOTTOM ROW (row 3) ══
                Kitchen(1) | 20i(2) | 22**(3) | 24***(4-5) | 30***(6-7) | Laundry(8) */}
            <FC lbl="Kitchen" col={4}  row={3} />
            <FC lbl="20i"     col={5}  row={3} />
            <RC  n="22"       col={6}  row={3} />
            <RC  n="24"       col={7}  row={3} span={2} />
            <RC  n="30"       col={9}  row={3} span={2} />
            <FC lbl="Laundry" col={11} row={3} />

            {/* ══ BLOCK C HEADER (row 4) ══ */}
            <FC lbl="Storage" col={1} row={4} />
            {/* col2 row4 = top of Corridor C */}
            <FC lbl="Pantry"  col={3} row={4} />

            {/* ══ CORRIDOR C — col 2, rows 4-12 ══ */}
            <CV col={2} r1={4} r2={12} lbl="Corridor C" />

            {/* ══ BLOCK C LEFT (col 1, rows 5-12) ══ */}
            {([ ["18",5],["16",6],["14",7],["12",8],["10",9],["8",10],["6",11],["2",12] ] as [string,number][]).map(([n,r]) => (
              <RC key={`cL${n}`} n={n} col={1} row={r} />
            ))}

            {/* ══ BLOCK C RIGHT (col 3, rows 5-12) ══ */}
            {([ ["19",5],["17",6],["15",7],["11",8],["7",9],["5",10],["3",11],["1",12] ] as [string,number][]).map(([n,r]) => (
              <RC key={`cR${n}`} n={n} col={3} row={r} />
            ))}

            {/* ══ LEGEND — cols 4-11, rows 4-24 ══ */}
            <div style={cs("4 / 12","4 / 25",{
              background:"white", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              gap:0, padding:28,
            })}>
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

            {/* ══ MAIN LOBBY BLOK D — 3 separator rows (13, 14, 15) ══
                row 13: Main Lobby (cols 1-2) | Office  (col 3)
                row 14: Main Lobby full       (cols 1-3) — label row
                row 15: Main Lobby (cols 1-2) | Storage (col 3)             */}
            <div style={cs("1 / 3","13",{ background:"#ced4da" })} />
            <FC lbl="Office"  col={3} row={13} />

            <div style={cs("1 / 4","14",{
              background:"#ced4da", fontSize:9, fontWeight:700, color:"#374151",
              justifyContent:"flex-start", paddingLeft:8, gap:4,
            })}>
              ◀ Main Lobby Blok D
            </div>

            <div style={cs("1 / 3","15",{ background:"#ced4da" })} />
            <FC lbl="Storage" col={3} row={15} />

            {/* ══ CORRIDOR E — col 2, rows 16-24 ══ */}
            <CV col={2} r1={16} r2={24} lbl="Corridor E" />

            {/* ══ BLOCK D/E LEFT (col 1, rows 16-24) ══ */}
            {([ ["34",16],["36",17],["38",18],["40",19],["42",20],["44",21],["46",22],["48",23] ] as [string,number][]).map(([n,r]) => (
              <RC key={`dL${n}`} n={n} col={1} row={r} />
            ))}
            <FC lbl="Panel Room" col={1} row={24} />

            {/* ══ BLOCK D/E RIGHT (col 3, rows 16-24) ══ */}
            {([ ["35",16],["37",17],["39",18],["41",19],["43",20],["45",21],["47",22],["49",23] ] as [string,number][]).map(([n,r]) => (
              <RC key={`dR${n}`} n={n} col={3} row={r} />
            ))}
            <FC lbl="Server MID" col={3} row={24} />

            {/* ══ LOBBY F — cols 1-3, rows 25-27 (full Block G height) ══ */}
            <Lobby col="1 / 4" row="25 / 28" label="Lobby Blok F" />

            {/* ══ BLOCK G TOP (row 25) ══
                Kitchen(1) | 50*(2) | 52*(3) | 54***(4-5) | 60***(6-7) | Laundry(8) */}
            <FC lbl="Kitchen" col={4}  row={25} />
            <RC n="50"        col={5}  row={25} />
            <RC n="52"        col={6}  row={25} />
            <RC n="54"        col={7}  row={25} span={2} />
            <RC n="60"        col={9}  row={25} span={2} />
            <FC lbl="Laundry" col={11} row={25} />

            {/* ══ CORRIDOR G (row 26) ══ */}
            <CH c1={4} c2={11} row={26} lbl="Coridor Blok G" />

            {/* ══ BLOCK G BOTTOM (row 27) ══
                [blank](1) | 51*(2) | 53*(3) | 55***(4-5) | 61***(6-7) | 63***(8) */}
            <div style={cs("4","27",{ background:LOBBY_BG })} />
            <RC n="51" col={5}  row={27} />
            <RC n="53" col={6}  row={27} />
            <RC n="55" col={7}  row={27} span={2} />
            <RC n="61" col={9}  row={27} span={2} />
            <RC n="63" col={11} row={27} />

          </div>
        </div>
      </div>

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
                      <span>{starsLabel(selected.stars)}</span>
                    </SheetDescription>
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide mt-1 shrink-0"
                    style={{ background:sbg(selected.status), color:sfg(selected.status), border:"1px solid #6b7280" }}>
                    {selected.status.replace(/_/g," ")}
                  </div>
                </div>
              </SheetHeader>

              <div className="py-5 flex-1 overflow-auto space-y-4">
                {selected.status==="available" && (
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Kamar bersih dan siap untuk check-in.</span>
                  </div>
                )}
                {(selected.status==="occupied_regular"||selected.status==="long_stay_japan"||selected.status==="long_stay_local") && (
                  <div className="rounded-lg border bg-card p-3 flex items-start gap-2 text-sm">
                    <User className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>Kamar sedang terisi. Buka menu <strong>Booking</strong> untuk detail tamu.</span>
                  </div>
                )}
                {selected.status==="blocked" && (
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
                    <span className="font-medium">{"★".repeat(selected.stars)} {starsLabel(selected.stars)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                {selected.status==="available" && (
                  <Button size="lg" className="w-full">Check-in Tamu</Button>
                )}
                {(selected.status==="occupied_regular"||selected.status==="long_stay_japan"||selected.status==="long_stay_local") && (
                  <Button size="lg" variant="secondary" className="w-full">Check-out Tamu</Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">Edit Detail</Button>
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
