import { useState } from "react";
import { useGetRooms } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BedDouble, CheckCircle2, Clock, Map, Star, User } from "lucide-react";
import type { Room } from "@workspace/api-client-react";

export default function FloorPlan() {
  const { data: rooms, isLoading } = useGetRooms();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string, isFacility: boolean) => {
    if (isFacility) return "bg-status-facility text-white";
    switch (status) {
      case 'available': return "bg-status-available text-white";
      case 'occupied_regular': return "bg-status-occupied text-black";
      case 'long_stay_japan': return "bg-status-long-japan text-white";
      case 'long_stay_local': return "bg-status-long-local text-white";
      case 'blocked': return "bg-status-blocked text-white";
      default: return "bg-gray-200 text-black";
    }
  };

  const renderStars = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <Star key={i} className="w-3 h-3 fill-current inline-block ml-0.5" />
    ));
  };

  const getRoom = (numStr: string) => {
    return rooms?.find(r => r.number === numStr);
  };

  const RoomBox = ({ num, isFacility = false, label = "" }: { num: string, isFacility?: boolean, label?: string }) => {
    const room = getRoom(num);
    
    if (isFacility) {
      const displayLabel = label || num;
      return (
        <div className={`h-24 rounded-lg border-2 border-transparent flex flex-col items-center justify-center ${getStatusColor('facility', true)} shadow-sm`}>
          <span className="font-bold text-sm text-center px-1">{displayLabel}</span>
        </div>
      );
    }

    if (!room) return <div className="h-24 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">N/A {num}</div>;

    return (
      <button 
        onClick={() => setSelectedRoom(room)}
        className={`h-24 relative rounded-lg border-2 border-black/10 flex flex-col items-center justify-center transition-all hover:-translate-y-1 hover:shadow-md ${getStatusColor(room.status, false)}`}
      >
        <span className="text-xl font-bold tracking-tight">{room.number}</span>
        <div className="absolute top-1 right-1 text-white/80">
          {renderStars(room.stars)}
        </div>
        {room.status !== 'available' && room.status !== 'blocked' && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            <User className="w-4 h-4 opacity-70" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Map className="w-8 h-8" />
            Interactive Floor Plan
          </h1>
          <p className="text-muted-foreground mt-1">Select a room to manage check-ins, check-outs, and details.</p>
        </div>
        
        <div className="bg-card border rounded-lg p-3 shadow-sm text-sm hidden lg:flex gap-4">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-status-available"></div>Available</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-status-occupied"></div>Occupied</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-status-long-japan"></div>Japan Long Stay</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-status-long-local"></div>Local Long Stay</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-status-facility"></div>Facility/Blocked</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30 rounded-xl border p-6 min-w-[800px]">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Blok A */}
          <section>
            <h2 className="text-lg font-bold mb-4 text-primary border-b pb-2">Blok A</h2>
            <div className="grid grid-cols-6 gap-4">
              <RoomBox num="21" />
              <RoomBox num="23" />
              <RoomBox num="27" />
              <RoomBox num="31" />
              <RoomBox num="33" />
              <div className="h-24 rounded-lg bg-gray-200/50 flex flex-col items-center justify-center text-gray-500 font-medium">Corridor</div>
              
              <RoomBox num="Kitchen" isFacility={true} label="Kitchen" />
              <RoomBox num="20i" isFacility={true} label="20i" />
              <RoomBox num="22" />
              <RoomBox num="24" />
              <RoomBox num="30" />
              <RoomBox num="Laundry" isFacility={true} label="Laundry" />
            </div>
          </section>

          <div className="grid grid-cols-2 gap-12">
            {/* Blok C */}
            <section>
              <h2 className="text-lg font-bold mb-4 text-primary border-b pb-2">Blok C</h2>
              <div className="grid grid-cols-2 gap-4">
                {[1,2, 3,4, 5,6, 7,8, 9,10, 11,12, 13,14, 15,16, 17,18, 19].map(num => (
                  <RoomBox key={num} num={num.toString()} />
                ))}
              </div>
            </section>

            {/* Blok D/E */}
            <section>
              <h2 className="text-lg font-bold mb-4 text-primary border-b pb-2">Blok D & E</h2>
              <div className="grid grid-cols-2 gap-4">
                <RoomBox num="Storage" isFacility={true} label="Storage" />
                <RoomBox num="Server MID" isFacility={true} label="Server MID" />
                {[34,35, 36,37, 38,39, 40,41, 42,43, 44,45, 46,47, 48,49].map(num => (
                  <RoomBox key={num} num={num.toString()} />
                ))}
              </div>
            </section>
          </div>

          {/* Blok G */}
          <section>
            <h2 className="text-lg font-bold mb-4 text-primary border-b pb-2">Blok G</h2>
            <div className="grid grid-cols-6 gap-4">
              <RoomBox num="Kitchen G" isFacility={true} label="Kitchen" />
              <RoomBox num="50" />
              <RoomBox num="52" />
              <RoomBox num="54" />
              <RoomBox num="60" />
              <RoomBox num="Laundry G" isFacility={true} label="Laundry" />
              
              <div />
              <RoomBox num="51" />
              <RoomBox num="53" />
              <RoomBox num="55" />
              <RoomBox num="61" />
              <RoomBox num="63" />
            </div>
          </section>

        </div>
      </div>

      <Sheet open={selectedRoom !== null} onOpenChange={(open) => !open && setSelectedRoom(null)}>
        <SheetContent className="sm:max-w-md w-full border-l-0 shadow-2xl">
          {selectedRoom && (
            <div className="h-full flex flex-col">
              <SheetHeader className="text-left pb-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <SheetTitle className="text-3xl font-bold flex items-center gap-3 text-primary">
                      Room {selectedRoom.number}
                      <Badge variant="outline" className="text-sm font-normal">Blok {selectedRoom.block}</Badge>
                    </SheetTitle>
                    <SheetDescription className="text-base mt-2 flex items-center gap-2">
                      <BedDouble className="w-4 h-4" />
                      {selectedRoom.type.charAt(0).toUpperCase() + selectedRoom.type.slice(1)} Room 
                      <span className="text-yellow-500 ml-1">{renderStars(selectedRoom.stars)}</span>
                    </SheetDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedRoom.status, selectedRoom.is_facility)}`}>
                    {selectedRoom.status.replace('_', ' ')}
                  </div>
                </div>
              </SheetHeader>

              <div className="py-6 flex-1 overflow-auto">
                <div className="space-y-6">
                  {/* Status info */}
                  {selectedRoom.status === 'available' && (
                    <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5" />
                      <div>
                        <p className="font-medium">Ready for check-in</p>
                        <p className="text-sm opacity-80 mt-1">This room is clean and available.</p>
                      </div>
                    </div>
                  )}

                  {selectedRoom.status.includes('occupied') || selectedRoom.status.includes('long_stay') ? (
                    <div className="border rounded-xl p-5 bg-card shadow-sm space-y-4">
                      <h3 className="font-bold text-lg border-b pb-2">Current Guest</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Name</p>
                          <p className="font-medium">Loading...</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Nationality</p>
                          <p className="font-medium">Loading...</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Check In</p>
                          <p className="font-medium">Loading...</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Check Out</p>
                          <p className="font-medium">Loading...</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {selectedRoom.notes && (
                    <div>
                      <h3 className="font-bold mb-2 text-sm text-muted-foreground">Notes</h3>
                      <p className="text-sm bg-muted/50 p-3 rounded-md border">{selectedRoom.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t mt-auto flex flex-col gap-3">
                {selectedRoom.status === 'available' && (
                  <Button size="lg" className="w-full text-lg h-12">Check-in Guest</Button>
                )}
                {(selectedRoom.status.includes('occupied') || selectedRoom.status.includes('long_stay')) && (
                  <Button size="lg" variant="secondary" className="w-full text-lg h-12">Check-out Guest</Button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full">Edit Details</Button>
                  <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10">Block Room</Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
