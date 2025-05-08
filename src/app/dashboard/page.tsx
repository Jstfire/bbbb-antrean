"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Role } from "@/generated/prisma";
import { Clock, RefreshCcw, Users, CheckCircle, XCircle, Hourglass } from "lucide-react";

interface DashboardStats {
    counts: {
        waiting: number;
        serving: number;
        completed: number;
        canceled: number;
        total: number;
    };
    averages: {
        waitTimeMinutes: number;
        serviceTimeMinutes: number;
    };
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        fetchStats();

        // Refresh stats every minute
        const interval = setInterval(() => {
            fetchStats();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/dashboard/stats");

            if (response.ok) {
                const data = await response.json();
                setStats(data);
                setLastUpdated(new Date());
            } else {
                toast.error("Gagal memuat statistik");
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
            toast.error("Terjadi kesalahan saat memuat statistik");
        } finally {
            setLoading(false);
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
                    <h1 className="font-bold text-2xl">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Selamat datang kembali, {session.user.name}
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <RefreshCcw className="w-4 h-4" />
                    <span>Perbarui Data</span>
                </Button>
            </div>

            <div className="text-muted-foreground text-sm">
                Terakhir diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <p>Memuat statistik...</p>
                </div>
            ) : stats ? (
                <>
                    <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-medium text-sm">Antrean Menunggu</CardTitle>
                                <Hourglass className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-2xl">{stats.counts.waiting}</div>
                                <p className="text-muted-foreground text-xs">
                                    Pengunjung yang sedang menunggu layanan
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/queue" className="w-full">
                                    <Button variant="outline" className="w-full">Lihat Antrean</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-medium text-sm">Sedang Dilayani</CardTitle>
                                <Users className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-2xl">{stats.counts.serving}</div>
                                <p className="text-muted-foreground text-xs">
                                    Pengunjung yang saat ini sedang dilayani
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/queue?tab=SERVING" className="w-full">
                                    <Button variant="outline" className="w-full">Kelola Layanan</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-medium text-sm">Selesai Hari Ini</CardTitle>
                                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-2xl">{stats.counts.completed}</div>
                                <p className="text-muted-foreground text-xs">
                                    Layanan selesai hari ini
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/queue?tab=COMPLETED" className="w-full">
                                    <Button variant="outline" className="w-full">Lihat Riwayat</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-medium text-sm">Waktu Rata-rata</CardTitle>
                                <Clock className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-2xl">{stats.averages.serviceTimeMinutes} menit</div>
                                <p className="text-muted-foreground text-xs">
                                    Durasi layanan rata-rata
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/analytics" className="w-full">
                                    <Button variant="outline" className="w-full">Lihat Analisis</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </div>

                    <div className="gap-4 grid md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Waktu Tunggu</CardTitle>
                                <CardDescription>
                                    Statistik waktu tunggu pengunjung
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col justify-center items-center gap-2 py-4">
                                    <div className="font-bold text-4xl">{stats.averages.waitTimeMinutes} menit</div>
                                    <p className="text-muted-foreground text-sm text-center">
                                        Rata-rata waktu tunggu pengunjung sebelum dilayani
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Total Antrean Hari Ini</CardTitle>
                                <CardDescription>
                                    Ringkasan antrean hari ini
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Total pengunjung</span>
                                        <span className="font-medium">{stats.counts.total}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center text-sm">
                                            <Hourglass className="mr-1 w-3 h-3" /> Menunggu
                                        </span>
                                        <span className="font-medium">{stats.counts.waiting}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center text-sm">
                                            <Users className="mr-1 w-3 h-3" /> Sedang dilayani
                                        </span>
                                        <span className="font-medium">{stats.counts.serving}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center text-sm">
                                            <CheckCircle className="mr-1 w-3 h-3" /> Selesai
                                        </span>
                                        <span className="font-medium">{stats.counts.completed}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center text-sm">
                                            <XCircle className="mr-1 w-3 h-3" /> Dibatalkan
                                        </span>
                                        <span className="font-medium">{stats.counts.canceled}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {session.user.role === Role.SUPERADMIN && (
                        <div className="gap-4 grid md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kelola Sistem</CardTitle>
                                    <CardDescription>
                                        Menu administrasi sistem
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-2">
                                        <Link href="/dashboard/users">
                                            <Button variant="outline" className="w-full">Kelola Admin</Button>
                                        </Link>
                                        <Link href="/dashboard/analytics">
                                            <Button variant="outline" className="w-full">Lihat Laporan</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Bantuan Cepat</CardTitle>
                                    <CardDescription>
                                        Panduan penggunaan sistem
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 text-sm">
                                        <p>
                                            <strong>Kelola Antrean:</strong> Untuk melayani pengunjung, klik tombol &quot;Layani&quot; pada antrean yang menunggu.
                                        </p>
                                        <p>
                                            <strong>Selesaikan Layanan:</strong> Setelah selesai melayani, klik tombol &quot;Selesai&quot; untuk menandai antrean telah selesai.
                                        </p>
                                        <p>
                                            <strong>Statistik:</strong> Lihat statistik dan analisis di halaman Analisis.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex justify-center items-center min-h-[200px]">
                    <p>Gagal memuat statistik</p>
                </div>
            )}
        </div>
    );
}