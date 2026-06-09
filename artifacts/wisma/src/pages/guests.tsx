import { useState } from "react";
import { useGetGuests } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Phone, FileText } from "lucide-react";

export default function Guests() {
  const [search, setSearch] = useState("");
  const { data: guests, isLoading } = useGetGuests();

  const filteredGuests = guests?.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.id_number.includes(search) ||
    g.nationality.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <Users className="w-8 h-8" />
          Guests Directory
        </h1>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b px-6 py-4 flex flex-row items-center sticky top-0 bg-card z-10">
          <div className="relative w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or nationality..."
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
                <TableHead>Guest Name</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>ID Type & Number</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading guests...</TableCell>
                </TableRow>
              ) : filteredGuests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No guests found.</TableCell>
                </TableRow>
              ) : (
                filteredGuests?.map(guest => (
                  <TableRow key={guest.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <TableCell className="font-medium text-primary">
                      {guest.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">{guest.nationality}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium uppercase text-muted-foreground">{guest.id_type}</span>
                        <span className="font-mono text-sm">{guest.id_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {guest.phone ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {guest.phone}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(guest.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
