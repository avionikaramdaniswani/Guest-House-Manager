import { useState } from "react";
import { useGetDailyReport, useGetMonthlyReport } from "@workspace/api-client-react";
import { format, subDays, startOfMonth } from "date-fns";
import { formatRupiah, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Printer, BarChart3, TrendingUp, Users, LogIn, LogOut } from "lucide-react";

export default function Reports() {
  const [dailyDate, setDailyDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear().toString());
  const [monthlyMonth, setMonthlyMonth] = useState((new Date().getMonth() + 1).toString());

  const { data: dailyData, isLoading: isLoadingDaily } = useGetDailyReport({ date: dailyDate });
  const { data: monthlyData, isLoading: isLoadingMonthly } = useGetMonthlyReport({ 
    year: parseInt(monthlyYear), 
    month: parseInt(monthlyMonth) 
  });

  const COLORS = ['#0C447C', '#22c55e', '#eab308', '#f97316', '#64748b', '#8b5cf6'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <BarChart3 className="w-8 h-8" />
          Reports & Statistics
        </h1>
        <Button onClick={handlePrint} variant="outline" className="print:hidden">
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 print:hidden">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="space-y-6 mt-6">
          <div className="flex items-center gap-4 print:hidden">
            <Input 
              type="date" 
              value={dailyDate} 
              onChange={(e) => setDailyDate(e.target.value)}
              className="w-[200px]"
            />
          </div>

          {isLoadingDaily ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : dailyData && (
            <div className="space-y-6 print:block">
              <div className="hidden print:block text-center mb-8">
                <h2 className="text-2xl font-bold">Daily Report - Wisma Eucaliptus</h2>
                <p className="text-lg">{formatDate(dailyDate)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                        <h3 className="text-2xl font-bold mt-1 text-primary">{formatRupiah(dailyData.revenue)}</h3>
                      </div>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Check-ins</p>
                        <h3 className="text-2xl font-bold mt-1">{dailyData.check_ins}</h3>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <LogIn className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Check-outs</p>
                        <h3 className="text-2xl font-bold mt-1">{dailyData.check_outs}</h3>
                      </div>
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <LogOut className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">New Reservations</p>
                        <h3 className="text-2xl font-bold mt-1">{dailyData.new_reservations}</h3>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2">Room</th>
                        <th className="pb-2">Guest</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.bookings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-muted-foreground">No bookings recorded on this date.</td>
                        </tr>
                      ) : (
                        dailyData.bookings.map((booking) => (
                          <tr key={booking.id} className="border-b last:border-0">
                            <td className="py-3 font-medium">{booking.room_number}</td>
                            <td className="py-3">{booking.guest_name}</td>
                            <td className="py-3">{booking.stay_type}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                booking.status === 'checked_in' ? 'bg-green-100 text-green-700' :
                                booking.status === 'checked_out' ? 'bg-gray-100 text-gray-700' :
                                booking.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {booking.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 text-right">{formatRupiah(booking.price_per_night)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6 mt-6">
          <div className="flex items-center gap-4 print:hidden">
            <Select value={monthlyYear} onValueChange={setMonthlyYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthlyMonth} onValueChange={setMonthlyMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">January</SelectItem>
                <SelectItem value="2">February</SelectItem>
                <SelectItem value="3">March</SelectItem>
                <SelectItem value="4">April</SelectItem>
                <SelectItem value="5">May</SelectItem>
                <SelectItem value="6">June</SelectItem>
                <SelectItem value="7">July</SelectItem>
                <SelectItem value="8">August</SelectItem>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingMonthly ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : monthlyData && (
            <div className="space-y-6 print:block">
              <div className="hidden print:block text-center mb-8">
                <h2 className="text-2xl font-bold">Monthly Report - Wisma Eucaliptus</h2>
                <p className="text-lg">{format(new Date(parseInt(monthlyYear), parseInt(monthlyMonth)-1, 1), 'MMMM yyyy')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <h3 className="text-3xl font-bold mt-2 text-primary">{formatRupiah(monthlyData.total_revenue)}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Avg Occupancy</p>
                    <h3 className="text-3xl font-bold mt-2">{monthlyData.avg_occupancy_rate.toFixed(1)}%</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Guests</p>
                    <h3 className="text-3xl font-bold mt-2">{monthlyData.total_guests}</h3>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Room Type Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData.room_type_revenue}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="type" />
                          <YAxis tickFormatter={(val) => `Rp${val/1000000}M`} />
                          <Tooltip 
                            formatter={(value: number) => formatRupiah(value)}
                            cursor={{fill: 'rgba(0,0,0,0.05)'}}
                          />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Guest Nationality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72 w-full">
                      {monthlyData.nationality_breakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={monthlyData.nationality_breakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="count"
                              nameKey="nationality"
                            >
                              {monthlyData.nationality_breakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No guest data available for this month
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
