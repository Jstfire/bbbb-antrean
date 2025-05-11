"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EnhancedThemeToggle } from "@/components/enhanced-theme-toggle";
import { ThemeColorsShowcase } from "@/components/enhanced-ui/theme-colors-showcase";
import { ThemeUsageExamples } from "@/components/enhanced-ui/theme-usage-examples";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Home,
    Settings,
    User,
    FileText,
    Calendar,
    Search,
    BarChart3
} from "lucide-react";
import { toast } from "sonner";

export default function UIShowcasePage() {
    const [demoSwitch, setDemoSwitch] = useState(false);
    // Using empty destructure pattern as we only need the setter
    const [, setCurrentTheme] = useState("light");

    useEffect(() => {
        // Update theme detection on client-side
        const isDark = document.documentElement.classList.contains("dark");
        setCurrentTheme(isDark ? "dark" : "light");

        // Listen for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    const isDark = document.documentElement.classList.contains("dark");
                    setCurrentTheme(isDark ? "dark" : "light");
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className="space-y-10 mx-auto px-4 py-8 container">
            <header className="flex md:flex-row flex-col justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="font-bold text-[var(--text-primary)] text-2xl md:text-3xl">
                        UI Showcase
                    </h1>
                    <p className="mt-1 text-[var(--text-secondary)]">
                        Demonstrasi komponen UI dengan tema baru
                    </p>
                </div>
                <div className="flex items-center gap-4">                    <EnhancedThemeToggle />
                    <Link href="/dashboard">
                        <Button
                            size="sm"
                            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] transition-colors"
                        >
                            Kembali ke Dashboard
                        </Button>
                    </Link>
                </div>            </header>            {/* Theme Colors Showcase */}
            <section className="mb-12">
                <ThemeColorsShowcase />
            </section>

            {/* Theme Usage Examples */}
            <section className="mb-12">
                <ThemeUsageExamples />
            </section>

            <section className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-[var(--card)] shadow-md border-[var(--border)]">
                    <CardHeader>
                        <CardTitle className="text-[var(--text-primary)]">Tombol-tombol</CardTitle>
                        <CardDescription className="text-[var(--text-secondary)]">
                            Berbagai variasi tombol
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                            <Button
                                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]"
                                onClick={() => toast.success("Tombol primary diklik!")}
                            >
                                Primary
                            </Button>
                            <Button
                                variant="secondary"
                                className="bg-[var(--secondary)] hover:opacity-90 text-[var(--secondary-foreground)]"
                            >
                                Secondary
                            </Button>
                            <Button
                                variant="destructive"
                                className="bg-[var(--destructive)] hover:opacity-90 text-[var(--destructive-foreground)]"
                            >
                                Destructive
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                className="hover:bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]"
                            >
                                Outline
                            </Button>
                            <Button
                                variant="ghost"
                                className="hover:bg-[var(--surface)] text-[var(--text-primary)]"
                            >
                                Ghost
                            </Button>
                            <Button
                                variant="link"
                                className="text-[var(--primary)]"
                            >
                                Link
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                size="sm"
                                className="bg-[var(--primary)] text-[var(--primary-foreground)]"
                            >
                                Small
                            </Button>
                            <Button
                                size="icon"
                                className="bg-[var(--primary)] text-[var(--primary-foreground)]"
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                                disabled
                                className="opacity-50 cursor-not-allowed"
                            >
                                Disabled
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--card)] shadow-md border-[var(--border)]">
                    <CardHeader>
                        <CardTitle className="text-[var(--text-primary)]">Input dan Form</CardTitle>
                        <CardDescription className="text-[var(--text-secondary)]">
                            Komponen untuk pengisian data
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[var(--text-primary)]">Email</Label>
                            <Input
                                id="email"
                                placeholder="nama@example.com"
                                className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="select" className="text-[var(--text-primary)]">Pilih Opsi</Label>
                            <Select>
                                <SelectTrigger
                                    id="select"
                                    className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
                                >
                                    <SelectValue placeholder="Pilih opsi" />
                                </SelectTrigger>
                                <SelectContent
                                    className="bg-[var(--popover)] border-[var(--border)] text-[var(--popover-foreground)]"
                                >
                                    <SelectItem value="option1">Opsi 1</SelectItem>
                                    <SelectItem value="option2">Opsi 2</SelectItem>
                                    <SelectItem value="option3">Opsi 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="terms" className="border-[var(--border)] text-[var(--primary)]" />
                            <Label
                                htmlFor="terms"
                                className="font-medium text-[var(--text-primary)] text-sm leading-none"
                            >
                                Saya setuju dengan syarat dan ketentuan
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="notifications"
                                checked={demoSwitch}
                                onCheckedChange={setDemoSwitch}
                                className="bg-[var(--muted)] data-[state=checked]:bg-[var(--primary)]"
                            />
                            <Label
                                htmlFor="notifications"
                                className="font-medium text-[var(--text-primary)] text-sm leading-none"
                            >
                                Aktifkan notifikasi
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--card)] shadow-md border-[var(--border)]">
                    <CardHeader>
                        <CardTitle className="text-[var(--text-primary)]">Badges & Avatars</CardTitle>
                        <CardDescription className="text-[var(--text-secondary)]">
                            Elemen pendukung UI lainnya
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-[var(--primary)] text-[var(--primary-foreground)]">
                                Primary
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="bg-[var(--secondary)] text-[var(--secondary-foreground)]"
                            >
                                Secondary
                            </Badge>
                            <Badge
                                variant="destructive"
                                className="bg-[var(--destructive)] text-[var(--destructive-foreground)]"
                            >
                                Destructive
                            </Badge>
                            <Badge
                                variant="outline"
                                className="border-[var(--border)] text-[var(--text-primary)]"
                            >
                                Outline
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <Avatar>
                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                                <AvatarFallback
                                    className="bg-[var(--muted)] text-[var(--muted-foreground)]"
                                >
                                    CN
                                </AvatarFallback>
                            </Avatar>

                            <Avatar>
                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lily" alt="Avatar" />
                                <AvatarFallback
                                    className="bg-[var(--primary)] text-[var(--primary-foreground)]"
                                >
                                    LW
                                </AvatarFallback>
                            </Avatar>

                            <Avatar>
                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Max" alt="Avatar" />
                                <AvatarFallback
                                    className="bg-[var(--secondary)] text-[var(--secondary-foreground)]"
                                >
                                    MJ
                                </AvatarFallback>
                            </Avatar>

                            <Avatar>
                                <AvatarFallback
                                    className="bg-[var(--accent)] text-[var(--accent-foreground)]"
                                >
                                    BPS
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section>
                <Card className="bg-[var(--card)] shadow-md border-[var(--border)]">
                    <CardHeader>
                        <CardTitle className="text-[var(--text-primary)]">Tabs dan Kartu</CardTitle>
                        <CardDescription className="text-[var(--text-secondary)]">
                            Navigasi dan konten bertab
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="antrean" className="w-full">
                            <TabsList
                                className="bg-[var(--muted)] mb-6 w-full text-[var(--muted-foreground)]"
                            >
                                <TabsTrigger
                                    value="antrean"
                                    className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--primary-foreground)]"
                                >
                                    Antrean
                                </TabsTrigger>
                                <TabsTrigger
                                    value="statistik"
                                    className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--primary-foreground)]"
                                >
                                    Statistik
                                </TabsTrigger>
                                <TabsTrigger
                                    value="pengaturan"
                                    className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--primary-foreground)]"
                                >
                                    Pengaturan
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="antrean" className="space-y-4">
                                <div className="gap-4 grid md:grid-cols-2">
                                    <Card className="bg-[var(--background)] border-[var(--border)]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-[var(--text-primary)] text-lg">Antrean Menunggu</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="font-bold text-[var(--primary)] text-3xl">14</div>
                                            <p className="text-[var(--text-secondary)] text-sm">Pengunjung dalam antrean</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-[var(--background)] border-[var(--border)]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-[var(--text-primary)] text-lg">Sedang Dilayani</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="font-bold text-[var(--accent)] text-3xl">3</div>
                                            <p className="text-[var(--text-secondary)] text-sm">Pengunjung sedang dilayani</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="statistik">
                                <div className="flex justify-center items-center bg-[var(--background)] p-4 border border-[var(--border)] rounded-lg min-h-[200px]">
                                    <div className="text-center">
                                        <BarChart3 className="mx-auto mb-2 w-10 h-10 text-[var(--primary)]" />
                                        <p className="text-[var(--text-primary)]">Data statistik akan ditampilkan di sini</p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="pengaturan">
                                <div className="space-y-4 bg-[var(--background)] p-4 border border-[var(--border)] rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-[var(--text-primary)]">Notifikasi Email</h3>
                                            <p className="text-[var(--text-secondary)] text-sm">Terima notifikasi via email</p>
                                        </div>
                                        <Switch className="bg-[var(--muted)] data-[state=checked]:bg-[var(--primary)]" />
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-[var(--text-primary)]">Suara Notifikasi</h3>
                                            <p className="text-[var(--text-secondary)] text-sm">Aktifkan suara notifikasi</p>
                                        </div>
                                        <Switch className="bg-[var(--muted)] data-[state=checked]:bg-[var(--primary)]" />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </section>

            <section className="gap-6 grid grid-cols-1 md:grid-cols-4">
                <Card className="col-span-1 bg-[var(--card)] shadow-md border-[var(--border)]">
                    <CardHeader>
                        <CardTitle className="text-[var(--text-primary)]">Menu Navigasi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <nav className="space-y-1">
                            <Button
                                variant="ghost"
                                className="justify-start hover:bg-[var(--primary)] w-full text-[var(--text-primary)] hover:text-[var(--primary-foreground)]"
                            >
                                <Home className="mr-2 w-4 h-4" />
                                Beranda
                            </Button>
                            <Button
                                variant="ghost"
                                className="justify-start hover:bg-[var(--primary)] w-full text-[var(--text-primary)] hover:text-[var(--primary-foreground)]"
                            >
                                <FileText className="mr-2 w-4 h-4" />
                                Laporan
                            </Button>
                            <Button
                                variant="ghost"
                                className="justify-start hover:bg-[var(--primary)] w-full text-[var(--text-primary)] hover:text-[var(--primary-foreground)]"
                            >
                                <Calendar className="mr-2 w-4 h-4" />
                                Jadwal
                            </Button>
                            <Button
                                variant="ghost"
                                className="justify-start hover:bg-[var(--primary)] w-full text-[var(--text-primary)] hover:text-[var(--primary-foreground)]"
                            >
                                <User className="mr-2 w-4 h-4" />
                                Profil
                            </Button>
                            <Button
                                variant="ghost"
                                className="justify-start hover:bg-[var(--primary)] w-full text-[var(--text-primary)] hover:text-[var(--primary-foreground)]"
                            >
                                <Settings className="mr-2 w-4 h-4" />
                                Pengaturan
                            </Button>
                        </nav>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-3 bg-[var(--card)] shadow-md border-[var(--border)]">
                    <CardHeader>
                        <CardTitle className="text-[var(--text-primary)]">Responsivitas dan Aksesbilitas</CardTitle>
                        <CardDescription className="text-[var(--text-secondary)]">
                            Contoh tata letak responsif dan komponen yang aksesibel
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="relative">
                            <Search className="top-1/2 left-3 absolute text-[var(--text-secondary)] -translate-y-1/2 transform" />
                            <Input
                                placeholder="Cari data..."
                                className="bg-[var(--background)] pl-10 border-[var(--border)] text-[var(--text-primary)]"
                            />
                        </div>

                        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col space-y-2 bg-[var(--background)] p-4 border border-[var(--border)] rounded-lg"
                                >
                                    <div className="bg-[var(--primary)] opacity-20 rounded h-20" aria-hidden="true" />
                                    <h3 className="font-medium text-[var(--text-primary)]">Item {i + 1}</h3>
                                    <p className="text-[var(--text-secondary)] text-sm">Deskripsi singkat untuk item ini</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex sm:flex-row flex-col justify-between items-center gap-4 bg-[var(--background)] p-4 border border-[var(--border)] rounded-lg">
                            <div>
                                <h3 className="font-medium text-[var(--text-primary)]">Pemberitahuan Penting</h3>
                                <p className="text-[var(--text-secondary)] text-sm">
                                    Pesan yang perlu diperhatikan oleh pengguna.
                                </p>
                            </div>
                            <Button
                                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] w-full sm:w-auto text-[var(--primary-foreground)]"
                            >
                                Tindakan
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex sm:flex-row flex-col justify-between items-center gap-4 pt-6 border-[var(--border)] border-t">
                        <p className="text-[var(--text-secondary)] text-sm">
                            Semua komponen di UI Showcase ini mengikuti standar aksesibilitas WCAG AA.
                        </p>
                        <Button
                            variant="outline"
                            className="hover:bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]"
                            onClick={() => toast.info("Kembali ke dokumentasi")}
                        >
                            Dokumentasi Lengkap
                        </Button>
                    </CardFooter>
                </Card>
            </section>

            <footer className="mt-16 pt-8 border-[var(--border)] border-t text-center">
                <p className="text-[var(--text-secondary)] text-sm">
                    Sistem Antrean PST BPS Buton Selatan &copy; 2025
                </p>
            </footer>
        </div>
    );
}
