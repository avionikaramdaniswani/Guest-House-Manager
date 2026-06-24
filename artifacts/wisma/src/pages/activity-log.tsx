import { useState } from "react";
import { useGetActivityLog } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, LogIn, LogOut, Settings, AlertCircle } from "lucide-react";

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  check_in:  { label: "Check-in",  color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",  icon: <LogIn  className="w-3 h-3" /> },
  check_out: { label: "Check-out", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: <LogOut className="w-3 h-3" /> },
  setting:   { label: "Pengaturan",color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",       icon: <Settings className="w-3 h-3" /> },
};

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_LABELS[action];
  if (meta) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
        {meta.icon} {meta.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
      <AlertCircle className="w-3 h-3" /> {action}
    </span>
  );
}

export default function ActivityLog() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [actionFilter, setActionFilter] = useState("all");

  const { data: logs, isLoading } = useGetActivityLog(
    {
      limit: 200,
      ...(date ? { date } : {}),
    }
  );

  const filtered = logs?.filter((l) => actionFilter === "all" || l.action === actionFilter) ?? [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <ClipboardList className="w-8 h-8" />
          Log Aktivitas
        </h1>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {filtered.length} entri
        </Badge>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[180px]"
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Semua Aktivitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aktivitas</SelectItem>
                <SelectItem value="check_in">Check-in</SelectItem>
                <SelectItem value="check_out">Check-out</SelectItem>
                <SelectItem value="setting">Pengaturan</SelectItem>
              </SelectContent>
            </Select>
            {date && (
              <button
                onClick={() => setDate("")}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Hapus filter tanggal
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[160px]">Waktu</TableHead>
                <TableHead className="w-[120px]">Aksi</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="w-[80px]">Kamar</TableHead>
                <TableHead className="w-[160px]">Tamu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Memuat log aktivitas...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>Tidak ada aktivitas{date ? ` pada ${format(new Date(date + "T00:00:00"), "dd MMM yyyy")}` : ""}.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell className="text-sm">{log.description}</TableCell>
                    <TableCell>
                      {log.room_number ? (
                        <span className="font-mono font-semibold text-primary">{log.room_number}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.guest_name ?? <span className="text-muted-foreground">-</span>}
                    </TableCell>
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
