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

// ─── Dimensions ────────────────────────────────────────────────
const RH = 36;          // room cell height (px)
const SW = 66;          // narrow cell width – Block C & D/E
const NW = 80;          // normal cell width – Block A & G
const CV_W = 15;        // vertical corridor width
const CH_H = 20;        // horizontal corridor height
const LOBBY_H = 48;     // lobby cell height
const SEP_H = 28;       // "Main Lobby Blok D" separator height

// ─── Status colours ────────────────────────────────────────────
function statusBg(status: string): string {
  switch (status) {
    case "available":       return "#ffffff";
    case "occupied_regular":return "#fde68a";
    case "long_stay_japan": return "#f97316";
    case "long_stay_local": return "#3b82f6";
    case "blocked":         return "#ef4444";
    default:                return "#ffffff";
  }
}
function statusFg(status: string): string {
  return ["long_stay_japan","long_stay_local","blocked"].includes(status)
    ? "#ffffff" : "#111827";
}

// ─── Legend helpers ────────────────────────────────────────────
function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width:44, height:18, background:color, border:"1px solid #6b7280", flexShrink:0 }} />
      <span style={{ fontSize:10, color:"#374151" }}>{label}</span>
    </div>
  );
}
function TypeRow({ label, desc }: { label: string; desc: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width:44, height:18, background:"#bbf7d0", border:"1px solid #6b7280",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:10, fontWeight:700, flexShrink:0 }}>
        {label}
      </div>
      <span style={{ fontSize:10, color:"#374151" }}>{desc}</span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function FloorPlan() {
  const { data: rooms, isLoading } = useGetRooms();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const getRoom = (num: string) => rooms?.find(r => r.number === num);

  // ── Cell helpers ──────────────────────────────────────────────
  const RC = ({ num, w = SW }: { num: string; w?: number }) => {
    const room = getRoom(num);
    if (!room) return (
      <div style={{ width: w, height: RH, border:"1px dashed #9ca3af",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:9, color:"#9ca3af", flexShrink:0 }}>{num}</div>
    );
    return (
      <button
        onClick={() => setSelectedRoom(room)}
        style={{
          width: w, height: RH, flexShrink: 0,
          background: statusBg(room.status),
          color: statusFg(room.status),
          border: "2px solid #1f2937",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          cursor:"pointer",
        }}
      >
        <span style={{ fontWeight:800, fontSize:11, lineHeight:1 }}>{room.number}</span>
        <span style={{ fontSize:8, lineHeight:1, marginTop:1, opacity:0.85 }}>
          {"★".repeat(room.stars)}
        </span>
      </button>
    );
  };

  const FC = ({ label, w = SW, h = RH }: { label: string; w?: number; h?: number }) => (
    <div style={{ width: w, height: h, flexShrink: 0,
      background:"#e5e7eb", border:"1px solid #6b7280",
      display:"flex", alignItems:"center", justifyContent:"center",
      textAlign:"center", fontSize:9, fontWeight:600, color:"#374151",
      padding:"0 2px" }}>
      {label}
    </div>
  );

  const EC = ({ w = NW }: { w?: number }) => (
    <div style={{ width: w, height: RH, flexShrink: 0 }} />
  );

  const VertCorridor = ({ label, h }: { label: string; h: number }) => (
    <div style={{ width: CV_W, height: h, flexShrink: 0,
      background:"#f3f4f6", borderLeft:"1px solid #9ca3af", borderRight:"1px solid #9ca3af",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ writingMode:"vertical-rl", transform:"rotate(180deg)",
        fontSize:8, color:"#6b7280", fontWeight:600, letterSpacing:1 }}>
        {label}
      </span>
    </div>
  );

  const HorizCorridor = ({ label, w }: { label: string; w: number }) => (
    <div style={{ width: w, height: CH_H, flexShrink: 0,
      background:"#f3f4f6", borderTop:"1px solid #9ca3af", borderBottom:"1px solid #9ca3af",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:9, color:"#6b7280", fontWeight:600, letterSpacing:1 }}>
      {label}
    </div>
  );

  // ── Block layouts ──────────────────────────────────────────────
  // Block C
  const blockC_L = ["Storage-C","18","16","14","12","10","8","6","2"];
  const blockC_R = ["Pantry-C","19","17","15","11","7","5","3","1","Office-C"];

  // Block D/E
  const blockDE_L = ["34","36","38","40","42","44","46","48","PanelRoom"];
  const blockDE_R = ["Storage-D","35","37","39","41","43","45","47","49","ServerMID"];

  const FACILITY_LABELS: Record<string, string> = {
    "Storage-C": "Storage", "Pantry-C": "Pantry", "Office-C": "Office",
    "Storage-D": "Storage", "PanelRoom": "Panel Room", "ServerMID": "Server MID",
    "Kitchen-A": "Kitchen", "Laundry-A": "Laundry",
    "Kitchen-G": "Kitchen", "Laundry-G": "Laundry",
    "20i": "20i",
  };
  const FACILITIES = new Set(Object.keys(FACILITY_LABELS));

  const Cell = ({ num, w = SW }: { num: string; w?: number }) =>
    FACILITIES.has(num)
      ? <FC label={FACILITY_LABELS[num]!} w={w} />
      : <RC num={num} w={w} />;

  // Heights
  const blockCH   = blockC_R.length * RH;   // 10 × 36 = 360
  const blockDEH  = blockDE_R.length * RH;  // 10 × 36 = 360
  const leftPanelW = SW + CV_W + SW;        // 147
  const rightW    = NW * 6;                 // 480
  const leftH     = LOBBY_H + blockCH + SEP_H + blockDEH + LOBBY_H;  // 844

  // Stars display for slide-over
  const starsLabel = (n: number) =>
    n === 1 ? "* Double Bed"
    : n === 2 ? "** Family Room"
    : "*** Longstay / Big Room";

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Title bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-primary">
            Denah Wisma Eucaliptus / Guest House Deluxe
          </h1>
          <p className="text-xs text-muted-foreground">
            Klik kamar untuk melihat detail · check-in · check-out
          </p>
        </div>
        <div className="flex gap-3 text-[11px] flex-wrap">
          {[
            { color:"#ffffff", border:"#6b7280", label:"Tersedia" },
            { color:"#fde68a", border:"#6b7280", label:"Reguler" },
            { color:"#f97316", border:"#6b7280", label:"Long Stay Japan" },
            { color:"#3b82f6", border:"#6b7280", label:"Long Stay Lokal" },
            { color:"#ef4444", border:"#6b7280", label:"Blocked" },
          ].map(({ color, border, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div style={{ width:14, height:14, background:color, border:`1px solid ${border}`, borderRadius:2 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Floor Plan ─────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div style={{ display:"inline-flex", gap:4, background:"white",
          border:"1px solid #d1d5db", borderRadius:8, padding:12 }}>

          {/* ══ LEFT PANEL: Lobby B │ Block C │ Separator │ Block D/E │ Lobby F ══ */}
          <div style={{ display:"flex", flexDirection:"column",
            border:"2px solid #1f2937", width: leftPanelW }}>

            {/* Lobby B */}
            <div style={{ height: LOBBY_H, background:"#f9fafb",
              borderBottom:"1px solid #6b7280",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, fontWeight:700, color:"#374151" }}>
              ◤ Lobby B
            </div>

            {/* Block C */}
            <div style={{ display:"flex" }}>
              <div style={{ display:"flex", flexDirection:"column" }}>
                {blockC_L.map(n => <Cell key={n} num={n} />)}
              </div>
              <VertCorridor label="Corridor C" h={blockCH} />
              <div style={{ display:"flex", flexDirection:"column" }}>
                {blockC_R.map(n => <Cell key={n} num={n} />)}
              </div>
            </div>

            {/* Main Lobby Blok D separator */}
            <div style={{ height: SEP_H, background:"#f9fafb",
              borderTop:"1px solid #9ca3af", borderBottom:"1px solid #9ca3af",
              display:"flex", alignItems:"center", paddingLeft:8,
              fontSize:9, fontWeight:700, color:"#6b7280" }}>
              ◀ Main Lobby Blok D
            </div>

            {/* Block D/E */}
            <div style={{ display:"flex" }}>
              <div style={{ display:"flex", flexDirection:"column" }}>
                {blockDE_L.map(n => <Cell key={n} num={n} />)}
              </div>
              <VertCorridor label="Corridor E" h={blockDEH} />
              <div style={{ display:"flex", flexDirection:"column" }}>
                {blockDE_R.map(n => <Cell key={n} num={n} />)}
              </div>
            </div>

            {/* Lobby F */}
            <div style={{ height: LOBBY_H, background:"#f9fafb",
              borderTop:"1px solid #6b7280",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, fontWeight:700, color:"#374151" }}>
              ◤ Lobby Blok F
            </div>
          </div>

          {/* ══ RIGHT SECTION: Block A │ Legend │ Block G ══ */}
          <div style={{ display:"flex", flexDirection:"column",
            width: rightW, height: leftH }}>

            {/* Block A */}
            <div style={{ border:"2px solid #1f2937", flexShrink:0 }}>
              {/* Top row: [empty] 21 23 27 31 33 */}
              <div style={{ display:"flex" }}>
                <EC w={NW} />
                <RC num="21" w={NW} />
                <RC num="23" w={NW} />
                <RC num="27" w={NW} />
                <RC num="31" w={NW} />
                <RC num="33" w={NW} />
              </div>
              <HorizCorridor label="Coridor BLOK A" w={rightW} />
              {/* Bottom row: Kitchen 20i 22 24 30 Laundry */}
              <div style={{ display:"flex" }}>
                <Cell num="Kitchen-A" w={NW} />
                <Cell num="20i"       w={NW} />
                <RC   num="22"        w={NW} />
                <RC   num="24"        w={NW} />
                <RC   num="30"        w={NW} />
                <Cell num="Laundry-A" w={NW} />
              </div>
            </div>

            {/* Legend (fills remaining middle space) */}
            <div style={{ flex:1, display:"flex", alignItems:"center",
              justifyContent:"center", padding:16 }}>
              <div>
                <p style={{ fontWeight:900, fontSize:17, color:"#374151",
                  textAlign:"center", lineHeight:1.4, letterSpacing:0.5 }}>
                  GUEST HOUSE DELUXE
                </p>
                <p style={{ fontWeight:900, fontSize:17, color:"#374151",
                  textAlign:"center", lineHeight:1.4, marginBottom:16, letterSpacing:0.5 }}>
                  BLOCK PLAN
                </p>
                <p style={{ fontWeight:700, fontSize:11, color:"#374151", marginBottom:6 }}>
                  Note : 2026
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:16 }}>
                  <LegendRow color="#f97316" label="Long Stay  8 room***  Japan" />
                  <LegendRow color="#3b82f6" label="Long Stay  2 room***  Local" />
                  <LegendRow color="#60a5fa" label="Long Stay  2 room *  Local" />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  <TypeRow label="*"   desc="Double Bed (1-2 Person)" />
                  <TypeRow label="**"  desc="Family Room (1-3 person)" />
                  <TypeRow label="***" desc="Room Longstay/ Big room" />
                </div>
              </div>
            </div>

            {/* Block G */}
            <div style={{ border:"2px solid #1f2937", flexShrink:0 }}>
              {/* Top row: Kitchen 50 52 54 60 Laundry */}
              <div style={{ display:"flex" }}>
                <Cell num="Kitchen-G" w={NW} />
                <RC   num="50"        w={NW} />
                <RC   num="52"        w={NW} />
                <RC   num="54"        w={NW} />
                <RC   num="60"        w={NW} />
                <Cell num="Laundry-G" w={NW} />
              </div>
              <HorizCorridor label="Coridor Blok G" w={rightW} />
              {/* Bottom row: [empty] 51 53 55 61 63 */}
              <div style={{ display:"flex" }}>
                <EC w={NW} />
                <RC num="51" w={NW} />
                <RC num="53" w={NW} />
                <RC num="55" w={NW} />
                <RC num="61" w={NW} />
                <RC num="63" w={NW} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Room Detail Slide-over ──────────────────────── */}
      <Sheet open={selectedRoom !== null} onOpenChange={open => !open && setSelectedRoom(null)}>
        <SheetContent className="sm:max-w-sm border-l shadow-2xl">
          {selectedRoom && (
            <div className="h-full flex flex-col">
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-2xl font-bold text-primary">
                      Kamar {selectedRoom.number}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">Blok {selectedRoom.block}</Badge>
                      <BedDouble className="w-4 h-4" />
                      {starsLabel(selectedRoom.stars)}
                    </SheetDescription>
                  </div>
                  <div
                    className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wide mt-1"
                    style={{
                      background: statusBg(selectedRoom.status),
                      color: statusFg(selectedRoom.status),
                      border: "1px solid #6b7280",
                    }}>
                    {selectedRoom.status.replace(/_/g, " ")}
                  </div>
                </div>
              </SheetHeader>

              <div className="py-5 flex-1 overflow-auto space-y-4">
                {/* Price */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Harga per malam</p>
                  <p className="text-xl font-bold text-primary">
                    Rp {selectedRoom.price_per_night.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Status */}
                {selectedRoom.status === "available" && (
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Kamar bersih dan siap check-in.</span>
                  </div>
                )}
                {(selectedRoom.status.includes("occupied") ||
                  selectedRoom.status.includes("long_stay")) && (
                  <div className="rounded-lg border p-3 flex items-start gap-2 text-sm bg-card">
                    <User className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>Kamar sedang terisi. Pergi ke menu <strong>Booking</strong> untuk detail tamu.</span>
                  </div>
                )}

                {/* Notes */}
                {selectedRoom.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Catatan</p>
                    <p className="text-sm bg-muted/40 rounded p-3 border">{selectedRoom.notes}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                {selectedRoom.status === "available" && (
                  <Button size="lg" className="w-full">Check-in Tamu</Button>
                )}
                {(selectedRoom.status.includes("occupied") ||
                  selectedRoom.status.includes("long_stay")) && (
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
