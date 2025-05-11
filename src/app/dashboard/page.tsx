"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Role } from "@/generated/prisma";
import { Clock, RefreshCcw, Users, CheckCircle, XCircle, Hourglass } from "lucide-react";
import { ClientOnlyCurrentTime } from "@/components/client-only-time";

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
            const response = await fetch("/api/dashboard/stats"); if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                toast.error("Gagal memuat statistik");
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
            toast.error("Terjadi kesalahan saat memuat statistik");
        } finally {
            setLoading(false);
        }
    }; if (!session) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <p className="text-primary-color">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 mx-auto px-4 py-6 container">
            {/* Header Section with improved whitespace and responsive typography */}
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="mb-1 font-bold text-primary-color text-2xl md:text-3xl">Dashboard</h1>
                    <p className="text-secondary-color text-sm md:text-base">
                        Selamat datang kembali, {session.user.name}
                    </p>
                </div>

                <div className="flex gap-2">
                    {/* Link to UI Showcase */}
                    {session.user.role === Role.ADMIN && (
                        <Link href="/dashboard/ui-showcase">
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 hover:bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]"
                                aria-label="UI Showcase"
                            >
                                <span>UI Showcase</span>
                            </Button>
                        </Link>
                    )}

                    <Button
                        onClick={fetchStats}
                        disabled={loading}
                        className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] transition-colors duration-200"
                        aria-label="Perbarui data statistik"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        <span>Perbarui Data</span>
                    </Button>
                </div>
            </div>            <div className="text-secondary-color text-xs md:text-sm">
                Terakhir diperbarui: <ClientOnlyCurrentTime fallback="-" />
            </div>

            {loading ? (
                <div className="flex justify-center items-center bg-surface rounded-xl min-h-[200px] animate-pulse">
                    <p className="text-secondary-color">Memuat statistik...</p>
                </div>
            ) : stats ? (
                <>
                    {/* Metric Cards with improved spacing, shadows, and responsive layout */}
                    <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Waiting Card */}
                        <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-semibold text-primary-color text-base">Antrean Menunggu</CardTitle>
                                <Hourglass className="w-5 h-5 text-accent" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-primary-color text-2xl md:text-3xl">{stats.counts.waiting}</div>
                                <p className="mt-1 text-secondary-color text-xs">
                                    Pengunjung yang sedang menunggu layanan
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/queue" className="w-full">
                                    <Button variant="outline" className="hover:bg-primary border-custom w-full hover:text-primary-foreground transition-colors">Lihat Antrean</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Serving Card */}
                        <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-semibold text-primary-color text-base">Sedang Dilayani</CardTitle>
                                <Users className="w-5 h-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-primary-color text-2xl md:text-3xl">{stats.counts.serving}</div>
                                <p className="mt-1 text-secondary-color text-xs">
                                    Pengunjung yang saat ini sedang dilayani
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/queue?tab=SERVING" className="w-full">
                                    <Button variant="outline" className="hover:bg-primary border-custom w-full hover:text-primary-foreground transition-colors">Kelola Layanan</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Completed Card */}
                        <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-semibold text-primary-color text-base">Selesai Hari Ini</CardTitle>
                                <CheckCircle className="w-5 h-5 text-secondary" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-primary-color text-2xl md:text-3xl">{stats.counts.completed}</div>
                                <p className="mt-1 text-secondary-color text-xs">
                                    Layanan selesai hari ini
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/queue?tab=COMPLETED" className="w-full">
                                    <Button variant="outline" className="hover:bg-primary border-custom w-full hover:text-primary-foreground transition-colors">Lihat Riwayat</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Average Time Card */}
                        <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-semibold text-primary-color text-base">Waktu Rata-rata</CardTitle>
                                <Clock className="w-5 h-5 text-secondary" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-primary-color text-2xl md:text-3xl">{stats.averages.serviceTimeMinutes} menit</div>
                                <p className="mt-1 text-secondary-color text-xs">
                                    Durasi layanan rata-rata
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/analytics" className="w-full">
                                    <Button variant="outline" className="hover:bg-primary border-custom w-full hover:text-primary-foreground transition-colors">Lihat Analisis</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Detailed Stat Cards with improved spacing and visualization */}
                    <div className="gap-6 grid md:grid-cols-2 mt-8">
                        <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="font-semibold text-primary-color text-xl">Waktu Tunggu</CardTitle>
                                <CardDescription className="text-secondary-color">
                                    Statistik waktu tunggu pengunjung
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col justify-center items-center gap-2 py-6">
                                    <div className="font-bold text-primary text-4xl">{stats.averages.waitTimeMinutes} menit</div>
                                    <p className="max-w-xs text-secondary-color text-sm text-center">
                                        Rata-rata waktu tunggu pengunjung sebelum dilayani
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="font-semibold text-primary-color text-xl">Total Antrean Hari Ini</CardTitle>
                                <CardDescription className="text-secondary-color">
                                    Ringkasan antrean hari ini
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 py-2">
                                    <div className="flex justify-between items-center pb-2 border-custom border-b">
                                        <span className="font-medium text-primary-color">Total pengunjung</span>
                                        <span className="font-semibold text-primary text-lg">{stats.counts.total}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="flex items-center text-primary-color">
                                            <Hourglass className="mr-2 w-4 h-4 text-accent" /> Menunggu
                                        </span>
                                        <span className="font-medium text-primary-color">{stats.counts.waiting}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="flex items-center text-primary-color">
                                            <Users className="mr-2 w-4 h-4 text-primary" /> Sedang dilayani
                                        </span>
                                        <span className="font-medium text-primary-color">{stats.counts.serving}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="flex items-center text-primary-color">
                                            <CheckCircle className="mr-2 w-4 h-4 text-secondary" /> Selesai
                                        </span>
                                        <span className="font-medium text-primary-color">{stats.counts.completed}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="flex items-center text-primary-color">
                                            <XCircle className="mr-2 w-4 h-4 text-accent" /> Dibatalkan
                                        </span>
                                        <span className="font-medium text-primary-color">{stats.counts.canceled}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Admin section with improved UI */}
                    {session.user.role === Role.SUPERADMIN && (
                        <div className="gap-6 grid md:grid-cols-2 mt-8">
                            <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="font-semibold text-primary-color text-xl">Kelola Sistem</CardTitle>
                                    <CardDescription className="text-secondary-color">
                                        Menu administrasi sistem
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-3 py-2">
                                        <Link href="/dashboard/users">
                                            <Button className="bg-primary hover:bg-primary-hover w-full text-primary-foreground">Kelola Admin</Button>
                                        </Link>
                                        <Link href="/dashboard/analytics">
                                            <Button variant="outline" className="border-custom w-full">Lihat Laporan</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="font-semibold text-primary-color text-xl">Bantuan Cepat</CardTitle>
                                    <CardDescription className="text-secondary-color">
                                        Panduan penggunaan sistem
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 py-2 text-sm">
                                        <p className="flex items-start">
                                            <span className="flex justify-center items-center bg-primary mt-0.5 mr-2 rounded-full w-5 h-5 text-primary-foreground text-xs">1</span>
                                            <span><strong className="text-primary-color">Kelola Antrean:</strong> Untuk melayani pengunjung, klik tombol &quot;Layani&quot; pada antrean yang menunggu.</span>
                                        </p>
                                        <p className="flex items-start">
                                            <span className="flex justify-center items-center bg-primary mt-0.5 mr-2 rounded-full w-5 h-5 text-primary-foreground text-xs">2</span>
                                            <span><strong className="text-primary-color">Selesaikan Layanan:</strong> Setelah selesai melayani, klik tombol &quot;Selesai&quot; untuk menandai antrean telah selesai.</span>
                                        </p>
                                        <p className="flex items-start">
                                            <span className="flex justify-center items-center bg-primary mt-0.5 mr-2 rounded-full w-5 h-5 text-primary-foreground text-xs">3</span>
                                            <span><strong className="text-primary-color">Statistik:</strong> Lihat statistik dan analisis di halaman Analisis.</span>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-surface shadow-md p-6 border border-custom rounded-xl text-center">
                    <p className="mb-2 text-secondary-color">Tidak ada data statistik yang tersedia saat ini.</p>
                    <Button
                        onClick={fetchStats}
                        className="bg-primary hover:bg-primary-hover mt-2 text-primary-foreground transition-colors"
                    >
                        Coba Lagi
                    </Button>
                </div>
            )}
        </div>
    );
}