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

// ─── Grid dimensions ───────────────────────────────────────────
// Columns: C-left | Corr-C | C-right | A/G-1..A/G-6
// Rows   : A-top(1) | A-corr(2) | C×10(3-12) | Sep(13) | DE×10(14-23) | G-top(24) | G-corr(25) | G-bot(26)
const RH   = 36;   // room cell height px
const SW   = 66;   // narrow col width  (Block C / D-E)
const NW   = 80;   // normal col width  (Block A / G)
const CVW  = 14;   // vertical corridor px
const CHH  = 20;   // horizontal corridor height px
const SEPH = 26;   // separator height px

const GCOLS = [SW, CVW, SW, NW, NW, NW, NW, NW, NW].map(x => `${x}px`).join(" ");
const GROWS = [
  `${RH}px`, `${CHH}px`,                                // rows 1-2  : Block A + Corridor A
  ...Array(10).fill(`${RH}px`),                         // rows 3-12 : Block C
  `${SEPH}px`,                                          // row  13   : separator
  ...Array(10).fill(`${RH}px`),                         // rows 14-23: Block D/E
  `${RH}px`, `${CHH}px`, `${RH}px`,                     // rows 24-26: Block G
].join(" ");

// ─── Status helpers ────────────────────────────────────────────
function sbg(s: string) {
  if (s === "available")         return "#ffffff";
  if (s === "occupied_regular")  return "#fde68a";
  if (s === "long_stay_japan")   return "#f97316";
  if (s === "long_stay_local")   return "#3b82f6";
  if (s === "blocked")           return "#ef4444";
  return "#ffffff";
}
function sfg(s: string) {
  return ["long_stay_japan", "long_stay_local", "blocked"].includes(s)
    ? "#ffffff" : "#111827";
}

// ─── Legend helpers ────────────────────────────────────────────
function LR({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 40, height: 16, background: color, border: "1px solid #6b7280", flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: "#374151" }}>{label}</span>
    </div>
  );
}
function TR({ lbl, desc }: { lbl: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 40, height: 16, background: "#bbf7d0", border: "1px solid #6b7280",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{lbl}</div>
      <span style={{ fontSize: 10, color: "#374151" }}>{desc}</span>
    </div>
  );
}

// ─── Cell base style ───────────────────────────────────────────
function cs(
  col: string,
  row: string,
  extra: React.CSSProperties = {}
): React.CSSProperties {
  return {
    gridColumn: col,
    gridRow: row,
    border: "1px solid #374151",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
    ...extra,
  };
}

// ─── Main component ────────────────────────────────────────────
export default function FloorPlan() {
  const { data: rooms, isLoading } = useGetRooms();
  const [selected, setSelected] = useState<Room | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const gr = (n: string) => rooms?.find(r => r.number === n);

  // Room button
  const RC = ({ n, col, row }: { n: string; col: number; row: number }) => {
    const room = gr(n);
    if (!room) {
      return <div style={cs(String(col), String(row), { background: "#f3f4f6", fontSize: 9, color: "#9ca3af" })}>{n}</div>;
    }
    return (
      <button
        onClick={() => setSelected(room)}
        style={cs(String(col), String(row), {
          background: sbg(room.status),
          color: sfg(room.status),
          cursor: "pointer",
          flexDirection: "column",
          gap: 1,
        })}
      >
        <span style={{ fontWeight: 800, fontSize: 11, lineHeight: 1 }}>{room.number}</span>
        <span style={{ fontSize: 8, lineHeight: 1 }}>{"★".repeat(room.stars)}</span>
      </button>
    );
  };

  // Facility cell
  const FC = ({ lbl, col, row }: { lbl: string; col: string; row: string }) => (
    <div style={cs(col, row, { background: "#e5e7eb", fontSize: 9, fontWeight: 600, color: "#374151", textAlign: "center", padding: "0 2px" })}>
      {lbl}
    </div>
  );

  // Empty white cell
  const EC = ({ col, row }: { col: number; row: number }) => (
    <div style={cs(String(col), String(row), { background: "white" })} />
  );

  // Vertical corridor spanning rows r1..r2 (inclusive)
  const CV = ({ col, r1, r2, lbl }: { col: number; r1: number; r2: number; lbl: string }) => (
    <div style={cs(String(col), `${r1} / ${r2 + 1}`, { background: "#f3f4f6" })}>
      <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 8, color: "#6b7280", fontWeight: 600, letterSpacing: 2 }}>
        {lbl}
      </span>
    </div>
  );

  // Horizontal corridor spanning cols c1..c2 (inclusive)
  const CH = ({ c1, c2, row, lbl }: { c1: number; c2: number; row: number; lbl: string }) => (
    <div style={cs(`${c1} / ${c2 + 1}`, String(row), { background: "#f3f4f6", fontSize: 9, fontWeight: 600, color: "#6b7280", letterSpacing: 1 })}>
      {lbl}
    </div>
  );

  const starsLabel = (n: number) =>
    n === 1 ? "Double Bed (★)" : n === 2 ? "Family Room (★★)" : "Longstay / Big Room (★★★)";

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* ── Title bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-primary">Denah Wisma Eucaliptus / Guest House Deluxe</h1>
          <p className="text-xs text-muted-foreground">Klik kamar untuk detail · check-in · check-out</p>
        </div>
        <div className="flex gap-3 text-[11px] flex-wrap">
          {[
            { bg: "#ffffff", label: "Tersedia" },
            { bg: "#fde68a", label: "Reguler" },
            { bg: "#f97316", label: "Long Stay Japan" },
            { bg: "#3b82f6", label: "Long Stay Lokal" },
            { bg: "#ef4444", label: "Blocked" },
          ].map(({ bg, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div style={{ width: 14, height: 14, background: bg, border: "1px solid #6b7280", borderRadius: 2 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Floor Plan Grid ── */}
      <div className="flex-1 overflow-auto">
        <div style={{ padding: 12, background: "white", width: "fit-content", border: "1px solid #e5e7eb", borderRadius: 8 }}>

          <div style={{
            display: "grid",
            gridTemplateColumns: GCOLS,
            gridTemplateRows: GROWS,
            border: "2px solid #374151",
          }}>

            {/* ══ LOBBY B — cols 1-3, rows 1-2 ══ */}
            <div style={cs("1 / 4", "1 / 3", { background: "#f3f4f6", fontWeight: 700, fontSize: 12, color: "#374151" })}>
              ◤ Lobby B
            </div>

            {/* ══ BLOCK A TOP ROW — row 1 ══ */}
            <EC col={4} row={1} />
            <RC n="21" col={5} row={1} />
            <RC n="23" col={6} row={1} />
            <RC n="27" col={7} row={1} />
            <RC n="31" col={8} row={1} />
            <RC n="33" col={9} row={1} />

            {/* ══ CORRIDOR A — cols 4-9, row 2 ══ */}
            <CH c1={4} c2={9} row={2} lbl="Coridor BLOK A" />

            {/* ══ ROW 3: Block C row-1 (Storage/Pantry) + Block A bottom row ══ */}
            <FC lbl="Storage" col="1"   row="3" />
            {/* col 2 row 3 = start of Corridor C (handled below) */}
            <FC lbl="Pantry"  col="3"   row="3" />
            <FC lbl="Kitchen" col="4"   row="3" />
            <FC lbl="20i"     col="5"   row="3" />
            <RC  n="22"       col={6}   row={3} />
            <RC  n="24"       col={7}   row={3} />
            <RC  n="30"       col={8}   row={3} />
            <FC lbl="Laundry" col="9"   row="3" />

            {/* ══ CORRIDOR C — col 2, rows 3-12 ══ */}
            <CV col={2} r1={3} r2={12} lbl="Corridor C" />

            {/* ══ BLOCK C LEFT COL — col 1, rows 4-11 ══ */}
            {([ ["18",4],["16",5],["14",6],["12",7],["10",8],["8",9],["6",10],["2",11] ] as [string,number][]).map(([n,r]) => (
              <RC key={`cL${n}`} n={n} col={1} row={r} />
            ))}
            <EC col={1} row={12} />  {/* bottom of left col has no room (Office only on right) */}

            {/* ══ BLOCK C RIGHT COL — col 3, rows 4-12 ══ */}
            {([ ["19",4],["17",5],["15",6],["11",7],["7",8],["5",9],["3",10],["1",11] ] as [string,number][]).map(([n,r]) => (
              <RC key={`cR${n}`} n={n} col={3} row={r} />
            ))}
            <FC lbl="Office" col="3" row="12" />

            {/* ══ SEPARATOR — cols 1-3, row 13 ══ */}
            <div style={cs("1 / 4", "13", { background: "#f9fafb", fontSize: 9, fontWeight: 700, color: "#6b7280", justifyContent: "flex-start", paddingLeft: 8 })}>
              ◀ Main Lobby Blok D
            </div>

            {/* ══ LEGEND — cols 4-9, rows 4-23 ══ */}
            <div style={cs("4 / 10", "4 / 24", { background: "white", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, padding: 20 })}>
              <p style={{ fontWeight: 900, fontSize: 16, color: "#374151", textAlign: "center", letterSpacing: 0.5 }}>GUEST HOUSE DELUXE</p>
              <p style={{ fontWeight: 900, fontSize: 16, color: "#374151", textAlign: "center", letterSpacing: 0.5, marginBottom: 16 }}>BLOCK PLAN</p>
              <p style={{ fontWeight: 700, fontSize: 11, color: "#374151", marginBottom: 6 }}>Note : 2026</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
                <LR color="#f97316" label="Long Stay  8 room***  Japan" />
                <LR color="#3b82f6" label="Long Stay  2 room***  Local" />
                <LR color="#60a5fa" label="Long Stay  2 room *  Local" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <TR lbl="*"   desc="Double Bed (1-2 Person)" />
                <TR lbl="**"  desc="Family Room (1-3 person)" />
                <TR lbl="***" desc="Room Longstay / Big room" />
              </div>
            </div>

            {/* ══ CORRIDOR E — col 2, rows 14-23 ══ */}
            <CV col={2} r1={14} r2={23} lbl="Corridor E" />

            {/* ══ BLOCK D/E LEFT COL — col 1, rows 14-22 ══ */}
            {([ ["34",14],["36",15],["38",16],["40",17],["42",18],["44",19],["46",20],["48",21] ] as [string,number][]).map(([n,r]) => (
              <RC key={`dL${n}`} n={n} col={1} row={r} />
            ))}
            <FC lbl="Panel Room" col="1" row="22" />
            <EC col={1} row={23} />  {/* bottom of left col (Server MID only on right) */}

            {/* ══ BLOCK D/E RIGHT COL — col 3, rows 14-23 ══ */}
            <FC lbl="Storage" col="3" row="14" />
            {([ ["35",15],["37",16],["39",17],["41",18],["43",19],["45",20],["47",21],["49",22] ] as [string,number][]).map(([n,r]) => (
              <RC key={`dR${n}`} n={n} col={3} row={r} />
            ))}
            <FC lbl="Server MID" col="3" row="23" />

            {/* ══ LOBBY F — cols 1-3, rows 24-25 ══ */}
            <div style={cs("1 / 4", "24 / 26", { background: "#f3f4f6", fontWeight: 700, fontSize: 12, color: "#374151" })}>
              ◤ Lobby Blok F
            </div>

            {/* ══ BLOCK G TOP ROW — row 24 ══ */}
            <FC lbl="Kitchen" col="4"  row="24" />
            <RC n="50"        col={5}  row={24} />
            <RC n="52"        col={6}  row={24} />
            <RC n="54"        col={7}  row={24} />
            <RC n="60"        col={8}  row={24} />
            <FC lbl="Laundry" col="9"  row="24" />

            {/* ══ CORRIDOR G — cols 4-9, row 25 ══ */}
            <CH c1={4} c2={9} row={25} lbl="Coridor Blok G" />

            {/* ══ BLOCK G BOTTOM ROW — row 26 ══ */}
            <EC col={4} row={26} />
            <RC n="51"  col={5}  row={26} />
            <RC n="53"  col={6}  row={26} />
            <RC n="55"  col={7}  row={26} />
            <RC n="61"  col={8}  row={26} />
            <RC n="63"  col={9}  row={26} />

          </div>
        </div>
      </div>

      {/* ── Room Detail Slide-over ── */}
      <Sheet open={selected !== null} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-sm border-l shadow-2xl">
          {selected && (
            <div className="h-full flex flex-col">
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="text-2xl font-bold text-primary">
                      Kamar {selected.number}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">Blok {selected.block}</Badge>
                      <BedDouble className="w-4 h-4" />
                      <span>{starsLabel(selected.stars)}</span>
                    </SheetDescription>
                  </div>
                  <div
                    className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide mt-1 shrink-0"
                    style={{ background: sbg(selected.status), color: sfg(selected.status), border: "1px solid #6b7280" }}>
                    {selected.status.replace(/_/g, " ")}
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

                {(selected.status === "occupied_regular" ||
                  selected.status === "long_stay_japan" ||
                  selected.status === "long_stay_local") && (
                  <div className="rounded-lg border bg-card p-3 flex items-start gap-2 text-sm">
                    <User className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>Kamar sedang terisi. Buka menu <strong>Booking</strong> untuk detail tamu.</span>
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
                    <span className="font-medium">{"★".repeat(selected.stars)} {starsLabel(selected.stars)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                {selected.status === "available" && (
                  <Button size="lg" className="w-full">Check-in Tamu</Button>
                )}
                {(selected.status === "occupied_regular" ||
                  selected.status === "long_stay_japan" ||
                  selected.status === "long_stay_local") && (
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
