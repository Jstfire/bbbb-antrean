"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { QueueStatus, Role } from "@/generated/prisma";
import { BarChart, DownloadIcon, PieChart } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { format, subMonths, startOfToday, startOfWeek, startOfMonth } from "date-fns";
// import { id } from "date-fns/locale";

interface AnalyticsData {
    summary: {
        totalVisitors: number;
        completedServices: number;
        canceledServices: number;
        averageWaitTimeMinutes: number;
        averageServiceTimeMinutes: number;
    };
    serviceDistribution: {
        name: string;
        count: number;
        percentage: number;
    }[];
    adminPerformance: {
        adminName: string;
        completedCount: number;
        averageServiceTime: number;
    }[];
    timeAnalysis: {
        hourOfDay: number;
        count: number;
    }[];
    dailyTrends: {
        date: string;
        waiting: number;
        completed: number;
        canceled: number;
    }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

export default function AnalyticsPage() {
    const { data: session } = useSession();
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<string>("today");
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        if (session) {
            fetchAnalyticsData(timeRange);
        }
    }, [session, timeRange]);

    const fetchAnalyticsData = async (range: string) => {
        try {
            setLoading(true);

            // Calculate date range based on selection
            let startDate;
            const today = new Date();

            switch (range) {
                case "today":
                    startDate = startOfToday();
                    break;
                case "week":
                    startDate = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
                    break;
                case "month":
                    startDate = startOfMonth(today);
                    break;
                case "3months":
                    startDate = subMonths(today, 3);
                    break;
                default:
                    startDate = startOfToday();
            }

            const formattedStartDate = format(startDate, "yyyy-MM-dd");

            const response = await fetch(`/api/analytics?startDate=${formattedStartDate}`);

            if (response.ok) {
                const data = await response.json();
                setAnalyticsData(data);
                setLastUpdated(new Date());
            } else {
                toast.error("Gagal memuat data analitik");
            }
        } catch (error) {
            console.error("Error fetching analytics data:", error);
            toast.error("Terjadi kesalahan saat memuat data analitik");
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async (exportFormat: string) => {
        try {
            // Calculate date range based on selection
            let startDate;
            const today = new Date();

            switch (timeRange) {
                case "today":
                    startDate = startOfToday();
                    break;
                case "week":
                    startDate = startOfWeek(today, { weekStartsOn: 1 });
                    break;
                case "month":
                    startDate = startOfMonth(today);
                    break;
                case "3months":
                    startDate = subMonths(today, 3);
                    break;
                default:
                    startDate = startOfToday();
            }

            const formattedStartDate = format(startDate, "yyyy-MM-dd");

            // Create a download link for the exported data
            const a = document.createElement("a");
            a.href = `/api/analytics/export?startDate=${formattedStartDate}&format=${exportFormat}`;
            a.download = `pst-queue-report-${format(new Date(), "yyyy-MM-dd")}.${exportFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast.success(`Data berhasil diekspor dalam format ${exportFormat.toUpperCase()}`);
        } catch (error) {
            console.error("Error exporting data:", error);
            toast.error("Terjadi kesalahan saat mengekspor data");
        }
    };

    if (!session) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-bold text-2xl">Analitik Antrean</h1>
                    <p className="text-muted-foreground">
                        Visualisasi dan laporan antrean PST
                    </p>
                </div>

                <div className="flex sm:flex-row flex-col gap-2">
                    <Select defaultValue={timeRange} onValueChange={(value) => setTimeRange(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Pilih rentang waktu" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hari Ini</SelectItem>
                            <SelectItem value="week">Minggu Ini</SelectItem>
                            <SelectItem value="month">Bulan Ini</SelectItem>
                            <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleExportData("csv")} disabled={loading}>
                            <DownloadIcon className="mr-2 w-4 h-4" />
                            CSV
                        </Button>
                        <Button variant="outline" onClick={() => handleExportData("json")} disabled={loading}>
                            <DownloadIcon className="mr-2 w-4 h-4" />
                            JSON
                        </Button>
                    </div>
                </div>
            </div>

            <div className="text-muted-foreground text-sm">
                Data terakhir diperbarui: {lastUpdated.toLocaleString("id-ID")}
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                    <p>Memuat data analitik...</p>
                </div>
            ) : analyticsData ? (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="font-medium text-sm">Total Pengunjung</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-2xl">{analyticsData.summary.totalVisitors}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="font-medium text-sm">Layanan Selesai</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-2xl">{analyticsData.summary.completedServices}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="font-medium text-sm">Rata-rata Waktu Tunggu</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-2xl">{analyticsData.summary.averageWaitTimeMinutes} menit</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="font-medium text-sm">Rata-rata Waktu Layanan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-2xl">{analyticsData.summary.averageServiceTimeMinutes} menit</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="gap-4 grid md:grid-cols-2">
                        {/* Service Distribution Pie Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <PieChart className="mr-2 w-5 h-5" />
                                    Distribusi Layanan
                                </CardTitle>
                                <CardDescription>
                                    Persentase pengunjung berdasarkan jenis layanan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-80">
                                {analyticsData.serviceDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={analyticsData.serviceDistribution}
                                                dataKey="count"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                            >
                                                {analyticsData.serviceDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value, name, props) => [`${value} pengunjung`, props.payload.name]} />
                                            <Legend />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex justify-center items-center h-full">
                                        <p className="text-muted-foreground">Tidak ada data layanan</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Admin Performance Bar Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <BarChart className="mr-2 w-5 h-5" />
                                    Kinerja Admin
                                </CardTitle>
                                <CardDescription>
                                    Jumlah layanan yang diselesaikan per admin
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-80">
                                {analyticsData.adminPerformance.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart
                                            data={analyticsData.adminPerformance}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="adminName" type="category" width={100} />
                                            <Tooltip formatter={(value) => [`${value} layanan`, "Jumlah Layanan"]} />
                                            <Legend />
                                            <Bar dataKey="completedCount" name="Jumlah Layanan" fill="#8884d8" />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex justify-center items-center h-full">
                                        <p className="text-muted-foreground">Tidak ada data kinerja admin</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Trends Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tren Layanan per Hari</CardTitle>
                            <CardDescription>
                                Jumlah antrean per hari berdasarkan status
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            {analyticsData.dailyTrends.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart
                                        data={analyticsData.dailyTrends}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="waiting" name="Menunggu" fill="#FFBB28" />
                                        <Bar dataKey="completed" name="Selesai" fill="#00C49F" />
                                        <Bar dataKey="canceled" name="Dibatalkan" fill="#FF8042" />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex justify-center items-center h-full">
                                    <p className="text-muted-foreground">Tidak ada data tren harian</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Peak Hours Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Jam Sibuk</CardTitle>
                            <CardDescription>
                                Distribusi pengunjung berdasarkan jam
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            {analyticsData.timeAnalysis.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart
                                        data={analyticsData.timeAnalysis}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hourOfDay" tickFormatter={(hour) => `${hour}:00`} />
                                        <YAxis />
                                        <Tooltip labelFormatter={(hour) => `Jam ${hour}:00`} />
                                        <Legend />
                                        <Bar dataKey="count" name="Jumlah Pengunjung" fill="#8884d8" />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex justify-center items-center h-full">
                                    <p className="text-muted-foreground">Tidak ada data analisis waktu</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex justify-center items-center min-h-[400px]">
                    <p>Gagal memuat data analitik</p>
                </div>
            )}
        </div>
    );
}