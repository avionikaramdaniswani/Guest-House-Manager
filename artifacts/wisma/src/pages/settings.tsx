import { useGetActivityLog } from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings as SettingsIcon, History } from "lucide-react";

export default function Settings() {
  const { data: logs, isLoading } = useGetActivityLog({ limit: 50 });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" />
          Pengaturan & Log
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="flex-1 flex flex-col overflow-hidden max-h-[800px]">
          <CardHeader className="border-b sticky top-0 bg-card z-10 pb-4">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Log Aktivitas
            </CardTitle>
            <CardDescription>Aksi dan perubahan sistem terbaru</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[180px]">Tanggal & Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Tamu</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Memuat log aktivitas...</TableCell>
                  </TableRow>
                ) : logs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Belum ada aktivitas tercatat.</TableCell>
                  </TableRow>
                ) : (
                  logs?.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-xs px-2 py-1 bg-secondary rounded-md">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.room_number || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.guest_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[400px] truncate" title={log.description}>
                        {log.description}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
