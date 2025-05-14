"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Role } from "@/generated/prisma";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Hourglass, Users, CheckCircle, XCircle, Settings, RefreshCcw } from "lucide-react";

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
    hash?: string;
    hasChanges?: boolean;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null); // State untuk menyimpan waktu update terakhir
    const [dataHash, setDataHash] = useState<string>(""); // Track data hash for change detection

    const fetchStats = useCallback(async (forceRefresh: boolean = false) => {
        if (!session) {
            setLoading(false);
            return;
        }

        // Only show loading indicator on forced refresh or initial load
        if (forceRefresh || !stats) {
            setLoading(true);
        }

        try {
            // Add hash parameter to check for changes unless force refreshing
            const url = `/api/dashboard/stats${!forceRefresh && dataHash ? `?hash=${dataHash}` : ''}`;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();

                // Only update if there are changes or initial load or force refresh
                if (forceRefresh || !data.hasOwnProperty('hasChanges') || data.hasChanges) {
                    setStats(data);
                    setLastUpdatedAt(new Date()); // Set waktu saat ini sebagai waktu update terakhir

                    // Store the hash for future comparisons
                    if (data.hash) setDataHash(data.hash);
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: "Gagal memuat statistik" }));
                toast.error(errorData.error || "Gagal memuat statistik");
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
            toast.error("Terjadi kesalahan saat memuat statistik");
        } finally {
            if (forceRefresh || !stats) {
                setLoading(false);
            }
        }
    }, [session, dataHash, stats]);

    // Setup polling for data changes with change detection
    useEffect(() => {
        if (!session) return;

        // Initial fetch
        fetchStats();

        // Set up polling for changes
        const pollInterval = 30000; // Poll every 30 seconds
        let pollTimer: NodeJS.Timeout | null = null;

        // Function to poll for changes
        const pollForChanges = () => {
            if (document.visibilityState === "visible") {
                fetchStats(false); // Don't force refresh on polling
            }

            // Schedule next poll
            pollTimer = setTimeout(pollForChanges, pollInterval);
        };

        // Start polling
        pollTimer = setTimeout(pollForChanges, pollInterval);

        // Track document visibility to pause polling when tab is not visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && pollTimer === null) {
                // Resume polling when tab becomes visible again
                fetchStats();
                pollTimer = setTimeout(pollForChanges, pollInterval);
            }
        };

        // Add visibility change listener
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (pollTimer) clearTimeout(pollTimer);
        };
    }, [fetchStats, session]);

    if (!session && loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <p className="text-primary-color">Loading session...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <p className="text-primary-color">Authenticating...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 mx-auto px-4 py-6 container">
            {/* Header Section */}
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="font-bold text-text-primary text-3xl">Dashboard</h1>
                    <p className="text-secondary-color">Statistik antrean hari ini.</p>
                </div>
                <div className="flex gap-2">
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
                    )}                    <Button
                        onClick={() => fetchStats(true)} // Call with forceRefresh=true
                        disabled={loading}
                        className="flex items-center gap-2 bg-[var(--primary)] hover:bg-orange-800 transition-colors duration-200"
                        aria-label="Perbarui data statistik"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        <span>Perbarui Data</span>
                    </Button>
                </div>
            </div>
            <div className="text-secondary-color text-xs md:text-sm">
                Data per: {lastUpdatedAt
                    ? new Intl.DateTimeFormat('id-ID', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                    }).format(lastUpdatedAt)
                    : (loading && !stats ? "Memuat data awal..." : "Belum ada data")}
            </div>

            {loading && !stats ? (
                <div className="flex justify-center items-center bg-surface rounded-xl min-h-[200px] animate-pulse">
                    <p className="text-secondary-color">Memuat statistik...</p>
                </div>
            ) : stats ? (
                <>
                    {/* Metric Cards */}
                    <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                                    <Button variant="ghost" className="justify-start p-2 w-full text-accent hover:text-accent/90 text-xs">Lihat Detail</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                        <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-semibold text-primary-color text-base">Sedang Dilayani</CardTitle>
                                <Users className="w-5 h-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-primary-color text-2xl md:text-3xl">{stats.counts.serving}</div>
                                <p className="mt-1 text-secondary-color text-xs">
                                    Pengunjung yang sedang dalam proses layanan
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/queue#serving" className="w-full">
                                    <Button variant="ghost" className="justify-start p-2 w-full text-primary hover:text-primary/90 text-xs">Lihat Detail</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                        <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-semibold text-primary-color text-base">Selesai Dilayani</CardTitle>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-primary-color text-2xl md:text-3xl">{stats.counts.completed}</div>
                                <p className="mt-1 text-secondary-color text-xs">
                                    Layanan yang telah selesai hari ini
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/all-queues?status=COMPLETED" className="w-full">
                                    <Button variant="ghost" className="justify-start p-2 w-full text-green-500 hover:text-green-500/90 text-xs">Lihat Detail</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                        <Card className="bg-surface shadow-md hover:shadow-lg border-custom overflow-hidden transition-all duration-200">
                            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                                <CardTitle className="font-semibold text-primary-color text-base">Dibatalkan</CardTitle>
                                <XCircle className="w-5 h-5 text-destructive" />
                            </CardHeader>
                            <CardContent>
                                <div className="font-bold text-primary-color text-2xl md:text-3xl">{stats.counts.canceled}</div>
                                <p className="mt-1 text-secondary-color text-xs">
                                    Layanan yang dibatalkan hari ini
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link href="/dashboard/all-queues?status=CANCELED" className="w-full">
                                    <Button variant="ghost" className="justify-start p-2 w-full text-destructive hover:text-destructive/90 text-xs">Lihat Detail</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Detailed Stat Cards */}
                    <div className="gap-6 grid md:grid-cols-2 mt-8">
                        <Card className="bg-surface shadow-lg p-6 border border-custom rounded-xl">
                            <h3 className="mb-3 font-semibold text-text-primary text-lg">Rata-rata Waktu Tunggu</h3>
                            <p className="font-bold text-accent text-3xl">{stats.averages.waitTimeMinutes} <span className="font-normal text-text-secondary text-sm">menit</span></p>
                        </Card>
                        <Card className="bg-surface shadow-lg p-6 border border-custom rounded-xl">
                            <h3 className="mb-3 font-semibold text-text-primary text-lg">Rata-rata Waktu Layanan</h3>
                            <p className="font-bold text-accent text-3xl">{stats.averages.serviceTimeMinutes} <span className="font-normal text-text-secondary text-sm">menit</span></p>
                        </Card>
                    </div>

                    {/* Admin section */}
                    {session.user.role === Role.SUPERADMIN && (
                        <div className="gap-6 grid md:grid-cols-2 mt-8">
                            <Card className="bg-surface shadow-lg p-6 border border-custom rounded-xl">
                                <h3 className="mb-3 font-semibold text-text-primary text-lg">Total Pengunjung Hari Ini</h3>
                                <p className="font-bold text-info text-3xl">{stats.counts.total} <span className="font-normal text-text-secondary text-sm">pengunjung</span></p>
                            </Card>
                            <Card className="bg-surface shadow-lg p-6 border border-custom rounded-xl">
                                <CardHeader className="mb-3 p-0">
                                    <CardTitle className="flex items-center font-semibold text-text-primary text-lg">
                                        <Settings className="mr-2 w-5 h-5 text-info" /> Pengaturan Sistem
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <p className="mb-3 text-text-secondary text-sm">Akses cepat ke halaman konfigurasi sistem.</p>
                                    <Link href="/dashboard/services">
                                        <Button variant="outline" className="w-full sm:w-auto">Kelola Layanan</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-surface shadow-md p-6 border border-custom rounded-xl text-center">
                    <p className="text-text-secondary">Tidak ada data statistik untuk ditampilkan.</p>                    <Button onClick={() => fetchStats(true)} className="bg-primary hover:bg-primary/90 mt-4 px-4 py-2 rounded text-primary-foreground">
                        Muat Ulang
                    </Button>
                </div>
            )}
        </div>
    );
}