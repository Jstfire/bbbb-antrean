"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceStatus } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Loader2, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClientTimestamp } from "@/components/client-timestamp";
import { ThemeToggle } from "@/components/theme-toggle";

interface Service {
    id: string;
    name: string;
    status: ServiceStatus;
}

interface QueueTrackingInfo {
    queueNumber: number;
    serviceName: string;
    visitorName: string;
    status: string;
    waitingBefore: number;
    estimated: number;
    createdAt: string;
    startTime: string | null;
    endTime: string | null;
    filledSKD: boolean;
}

const visitorFormSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
    institution: z.string().optional(),
    email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
    serviceId: z.string().min(1, "Layanan harus dipilih"),
});

type VisitorFormValues = z.infer<typeof visitorFormSchema>;

export default function VisitorFormPage({ params }: { params: Promise<{ uuid: string }> }) {
    const [isLoading, setIsLoading] = useState(true); // Start with loading state
    const [isValid, setIsValid] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [queueInfo, setQueueInfo] = useState<{
        queueNumber: number;
        serviceName: string;
        visitorName: string;
        redirectUrl?: string;
    } | null>(null);
    const [trackingInfo, setTrackingInfo] = useState<QueueTrackingInfo | null>(null);
    const [trackingStatus, setTrackingStatus] = useState<string | null>(null); const [trackingMessage, setTrackingMessage] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false); // Control when to show the form
    const [queueHash, setQueueHash] = useState<string>("");
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null); // Track when the data was last updated

    // Get the UUID from params
    const { uuid } = use(params);

    // Get search params to check for direct form flag
    // const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    // const shouldShowForm = searchParams.get('directToForm') === 'true';

    const form = useForm<VisitorFormValues>({
        resolver: zodResolver(visitorFormSchema),
        defaultValues: {
            name: "",
            phone: "",
            institution: "",
            email: "",
            serviceId: "",
        },
    });    // Function to check tracking status
    const checkTrackingStatus = useCallback(async (forceRefresh: boolean = false) => {
        try {
            // Only show loading indicator on initial load or forced refresh
            if (!trackingInfo || forceRefresh) {
                setIsLoading(true);
            }

            const response = await fetch(`/api/visitor-form/track`, {
                headers: {
                    "x-visitor-uuid": uuid,
                    // Only send hash for change detection if not forcing refresh
                    ...((!forceRefresh && queueHash) ? { "x-queue-hash": queueHash } : {})
                },
            });

            if (response.ok) {
                const data = await response.json();                // Only update the UI if there are changes to the tracking data, this is the first load, or we're forcing a refresh
                if (data.hasChanges || !trackingInfo || forceRefresh) {
                    if (data.tracking.status === "SUCCESS") {
                        setTrackingInfo(data.tracking.queue);
                        setTrackingStatus("SUCCESS");
                        setIsTracking(true);
                        setIsValid(true);
                        // Store the hash for future comparisons
                        setQueueHash(data.hash || "");
                        // Update the last updated timestamp
                        setLastUpdatedAt(new Date());
                    } else if (data.tracking.status === "NOT_SUBMITTED") {
                        setTrackingStatus("NOT_SUBMITTED");
                        setTrackingMessage(data.tracking.message);
                        setIsTracking(false);
                        setIsValid(true);
                    }
                }
            } else {
                // Handle error conditions only if this is the first load or we're not already tracking
                if (!trackingInfo || !isTracking) {
                    // Track attempt failed - this could mean invalid UUID or other error
                    setIsTracking(false);
                    setTrackingStatus(null);
                }
            }
        } catch (error) {
            console.error("Error checking tracking status:", error);
            if (!trackingInfo || !isTracking) {
                setTrackingStatus(null);
            }
        } finally {
            // Only update loading state for initial load or manual refresh
            if (!trackingInfo || forceRefresh) {
                setIsLoading(false);
            }
        }
    }, [uuid, queueHash, trackingInfo, isTracking]);


    useEffect(() => {
        // Validate UUID and fetch services or check tracking status
        const validateUuid = async () => {
            try {
                setIsLoading(true);

                // First check if this is a valid tracking request
                await checkTrackingStatus();                    // If we're not tracking, try to validate as normal form UUID
                if (!isTracking && trackingStatus !== "SUCCESS") {
                    // First, check if UUID is valid by fetching services
                    const response = await fetch(`/api/visitor-form/${uuid}`, {
                        headers: {
                            "x-visitor-uuid": uuid,
                        },
                    }); if (response.status === 200) {
                        const data = await response.json();
                        // Instead of showing the form and then redirecting, redirect immediately
                        window.location.href = "/visitor-form/preload?uuid=" + data.dynamicUuid;
                        return; // Exit early to prevent form from showing
                    } else {
                        const response = await fetch(`/api/visitor-form/services`, {
                            headers: {
                                "x-visitor-uuid": uuid,
                            },
                        });

                        if (response.status === 200) {
                            const data = await response.json();
                            setServices(data.services);
                            setIsValid(true);
                            setShowForm(true); // Only now show the form when we're sure
                        } else {
                            // Only show error if we couldn't track OR get services
                            // Check if we're truly not in any valid state
                            if (trackingStatus !== "NOT_SUBMITTED" &&
                                trackingStatus !== "SUCCESS" &&
                                !isTracking) {
                                setIsValid(false);
                                // Don't use toast here as it might appear even when tracking is valid
                                // We'll use a dedicated error component instead
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error validating UUID:", error);
                setIsValid(false);
                toast.error("Terjadi kesalahan, silakan coba lagi");
            } finally {
                setIsLoading(false);
            }
        };

        if (uuid) {
            validateUuid();
        }
    }, [uuid, isTracking, trackingStatus, checkTrackingStatus]);    // Setup polling for tracking status updates with hash-based change detection
    useEffect(() => {
        let pollingInterval: NodeJS.Timeout | null = null;

        if (isTracking && trackingStatus === "SUCCESS" && trackingInfo?.status !== "COMPLETED") {
            // Function to poll for changes
            const pollForChanges = () => {
                if (document.visibilityState === "visible") {
                    checkTrackingStatus(false); // Don't force refresh on polling
                }

                // Schedule next poll
                pollingInterval = setTimeout(pollForChanges, 30000); // Refresh every 30 seconds
            };

            // Start polling
            pollingInterval = setTimeout(pollForChanges, 30000);

            // Track document visibility to pause polling when tab is not visible
            const handleVisibilityChange = () => {
                if (document.visibilityState === "visible" && pollingInterval === null) {
                    // Resume polling when tab becomes visible again
                    checkTrackingStatus(false);
                    pollingInterval = setTimeout(pollForChanges, 30000);
                }
            };

            // Add visibility change listener
            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                if (pollingInterval) clearTimeout(pollingInterval);
            };
        }

        // Cleanup
        return () => {
            if (pollingInterval) clearTimeout(pollingInterval);
        };
    }, [isTracking, trackingStatus, trackingInfo, checkTrackingStatus]);

    const onSubmit = async (data: VisitorFormValues) => {
        try {
            setIsLoading(true);

            const response = await fetch("/api/visitor-form/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...data,
                    tempUuid: uuid,
                }),
            });

            const result = await response.json(); if (response.ok) {
                setQueueInfo(result.data);
                setIsSubmitted(true);
                toast.success("Formulir berhasil dikirim");

                // If redirectUrl is provided, use it to go directly to tracking view
                if (result.data.redirectUrl) {
                    // Add a short delay before redirecting to allow the toast to show
                    setTimeout(() => {
                        window.location.href = result.data.redirectUrl;
                    }, 1000);
                    return;
                }

                // After submission, check tracking status to show queue info
                await checkTrackingStatus();
            } else {
                toast.error(result.error || "Gagal mengirim formulir");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Terjadi kesalahan saat mengirim formulir");
        } finally {
            setIsLoading(false);
        }
    };

    const getQueueStatusBadge = (status: string) => {
        switch (status) {
            case "WAITING":
                return <Badge variant="outline" className="bg-yellow-100 ml-2 text-yellow-800">Menunggu</Badge>;
            case "SERVING":
                return <Badge variant="outline" className="bg-blue-100 ml-2 text-blue-800">Sedang Dilayani</Badge>;
            case "COMPLETED":
                return <Badge variant="outline" className="bg-green-100 ml-2 text-green-800">Selesai</Badge>;
            case "CANCELED":
                return <Badge variant="outline" className="bg-red-100 ml-2 text-red-800">Dibatalkan</Badge>;
            default:
                return null;
        }
    }; const openSKD2025Form = () => {
        window.open("https://skd.bps.go.id/SKD2025/web/entri/responden/blok1?token=NNLZR0-Ikj98u0ciQHM0bpCHH018ESCbIDW0w90wUTUU2k5dv7OylsciSW4odYl5ZFrBGLweIGNGOYTXy6_AjBPg3QzJvcMRE4Cq", "_blank");
    };

    const markSKDFilled = async () => {
        if (!uuid) return;

        try {
            setIsLoading(true);
            const response = await fetch(`/api/visitor-form/skd`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tempUuid: uuid,
                    filled: true,
                }),
            }); if (response.ok) {
                toast.success("Terima kasih! Status SKD telah diperbarui");
                // Refresh tracking info to show updated SKD status
                await checkTrackingStatus();
                // Update last updated time
                setLastUpdatedAt(new Date());
            } else {
                toast.error("Gagal memperbarui status SKD");
            }
        } catch (error) {
            console.error("Error updating SKD status:", error);
            toast.error("Terjadi kesalahan saat memperbarui status SKD");
        } finally {
            setIsLoading(false);
        }
    };    // Render loading state
    if (isLoading) {
        return (
            <div className="relative flex justify-center items-center bg-background p-4 min-h-screen">
                {/* Theme toggle button at top right */}
                <div className="top-4 right-4 z-10 absolute">
                    <ThemeToggle />
                </div>
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-primary">
                            <div className="bg-muted mx-auto rounded w-3/4 h-8 animate-pulse"></div>
                        </CardTitle>
                        <CardDescription>
                            <div className="bg-muted mt-2 rounded w-full h-6 animate-pulse"></div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-6 py-4">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                        <div className="space-y-8 w-full">
                            <div className="bg-muted rounded w-full h-12 animate-pulse"></div>
                            <div className="bg-muted rounded w-full h-12 animate-pulse"></div>
                            <div className="bg-muted rounded w-full h-12 animate-pulse"></div>
                        </div>
                        <p className="mt-4 text-muted-foreground text-center">
                            Memuat data antrean...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Render tracking view
    if (isTracking && trackingInfo) {
        return (
            <div className="relative flex justify-center items-center bg-background p-4 min-h-screen">
                {/* Theme toggle button at top right */}
                <div className="top-4 right-4 z-10 absolute">
                    <ThemeToggle />
                </div>
                <Card className="w-full max-w-md">                    <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-primary">Status Antrean</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkTrackingStatus(true)}
                            disabled={isLoading}
                            className="flex items-center gap-1"
                        >
                            <RefreshCcw className="w-3 h-3" />
                            <span>{isLoading ? "Memuat..." : "Perbarui"}</span>
                        </Button>
                    </div>
                    <CardDescription className="text-center">
                        BPS Kabupaten Buton Selatan
                    </CardDescription>
                </CardHeader><CardContent className="space-y-6">
                        <div className="flex flex-col justify-center items-center space-y-2">
                            <p className="font-bold text-accent text-4xl">{trackingInfo.queueNumber}</p>
                            <p className="text-lg">Nomor Antrean Anda</p>
                            {getQueueStatusBadge(trackingInfo.status)}
                        </div>

                        <div className="space-y-3">
                            <div className="bg-muted p-3 rounded-md">
                                <p className="mb-1 font-semibold text-sm">Informasi Pengunjung</p>
                                <p className="text-muted-foreground text-sm">Nama: {trackingInfo.visitorName}</p>
                                <p className="text-muted-foreground text-sm">Layanan: {trackingInfo.serviceName}</p>
                            </div>

                            {trackingInfo.status === "WAITING" && (
                                <div className="flex items-start space-x-3 bg-yellow-50 p-3 rounded-md">
                                    <Clock className="mt-0.5 w-5 h-5 text-yellow-500" />
                                    <div>
                                        <p className="font-medium text-yellow-800 text-sm">Menunggu Giliran</p>
                                        <p className="text-yellow-700 text-sm">
                                            Ada {trackingInfo.waitingBefore} antrean sebelum Anda
                                        </p>
                                        <p className="text-yellow-700 text-sm">
                                            Estimasi waktu tunggu: ±{trackingInfo.estimated} menit
                                        </p>
                                    </div>
                                </div>
                            )}

                            {trackingInfo.status === "SERVING" && (
                                <div className="flex items-start space-x-3 bg-blue-50 p-3 rounded-md">
                                    <Loader2 className="mt-0.5 w-5 h-5 text-blue-500 animate-spin" />
                                    <div>
                                        <p className="font-medium text-blue-800 text-sm">Sedang Dilayani</p>
                                        <p className="text-blue-700 text-sm">
                                            Anda sedang dalam proses pelayanan
                                        </p>
                                        <p className="text-blue-700 text-sm">
                                            Mulai dilayani: <ClientTimestamp timestamp={trackingInfo.startTime} format="time" locale="id-ID" />
                                        </p>
                                    </div>
                                </div>
                            )}

                            {trackingInfo.status === "COMPLETED" && (
                                <div className="flex items-start space-x-3 bg-green-50 p-3 rounded-md">
                                    <CheckCircle className="mt-0.5 w-5 h-5 text-green-500" />
                                    <div>
                                        <p className="font-medium text-green-800 text-sm">Pelayanan Selesai</p>
                                        <p className="text-green-700 text-sm">
                                            Antrean Anda telah selesai dilayani
                                        </p>
                                        <p className="text-green-700 text-sm">
                                            Selesai pada: {new Date(trackingInfo.endTime as string).toLocaleTimeString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {trackingInfo.status === "CANCELED" && (
                                <div className="flex items-start space-x-3 bg-red-50 p-3 rounded-md">
                                    <AlertCircle className="mt-0.5 w-5 h-5 text-red-500" />
                                    <div>
                                        <p className="font-medium text-red-800 text-sm">Antrean Dibatalkan</p>
                                        <p className="text-red-700 text-sm">
                                            Antrean Anda telah dibatalkan oleh admin
                                        </p>
                                    </div>
                                </div>
                            )}                            {/* SKD Form section - show for all queue statuses */}
                            <Alert className="bg-blue-50 border-blue-200">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                                <AlertTitle className="text-blue-800">Survei Kepuasan Pelanggan</AlertTitle>
                                <AlertDescription className="text-blue-700">
                                    Mohon luangkan waktu sejenak untuk mengisi Survei Kepuasan Pelanggan.
                                </AlertDescription>
                                <div className="flex sm:flex-row flex-col gap-2 mt-2">
                                    <Button onClick={openSKD2025Form}>Isi Survei SKD2025</Button>
                                    {!trackingInfo.filledSKD && (
                                        <Button
                                            variant="outline"
                                            onClick={markSKDFilled}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Memproses..." : "Saya Sudah Mengisi"}
                                        </Button>
                                    )}
                                    {trackingInfo.filledSKD && (
                                        <div className="flex items-center space-x-2 bg-green-100 mt-1 px-2 py-1 rounded-md text-green-800 text-sm">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Survei sudah diisi, terima kasih!</span>
                                        </div>
                                    )}
                                </div>
                            </Alert>
                        </div>

                    </CardContent>                    <CardFooter className="flex justify-center">
                        <p className="text-muted-foreground text-xs text-center">
                            Status antrean diperbarui otomatis saat ada perubahan. Klik &quot;Perbarui&quot; untuk pembaruan manual. Terakhir diperbarui: {lastUpdatedAt
                                ? new Intl.DateTimeFormat('id-ID', {
                                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                                }).format(lastUpdatedAt)
                                : "Baru saja"}
                        </p>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (!isValid) {
        return (
            <div className="flex justify-center items-center bg-background p-4 h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-primary text-center">Link Tidak Valid</CardTitle>
                        <CardDescription className="text-center">
                            Link yang Anda gunakan tidak valid atau sudah kedaluwarsa
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p>Silakan scan QR code di lokasi PST untuk mendapatkan link baru.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isSubmitted && queueInfo) {
        return (
            <div className="flex justify-center items-center bg-background p-4 h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-primary text-center">Antrean Berhasil Dibuat</CardTitle>
                        <CardDescription className="text-center">
                            Terima kasih telah mengisi formulir
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col justify-center items-center space-y-1">
                            <p className="font-bold text-accent text-3xl">{queueInfo.queueNumber}</p>
                            <p className="text-xl">Nomor Antrean Anda</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-muted-foreground text-sm">Nama: {queueInfo.visitorName}</p>
                            <p className="text-muted-foreground text-sm">Layanan: {queueInfo.serviceName}</p>
                        </div>
                        <div className="bg-muted p-4 rounded-md text-sm">
                            <p>Silakan tunggu sampai nomor antrean Anda dipanggil oleh petugas.</p>
                        </div>
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                            <AlertTitle className="text-blue-800">Simpan Link Ini</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                Anda dapat melihat status antrean dengan membuka link ini kembali. Bookmark link ini untuk kemudahan akses.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    } return (
        <div className="relative flex justify-center items-center bg-background p-4 min-h-screen">
            {/* Theme toggle button at top right */}
            <div className="top-4 right-4 z-10 absolute">
                <ThemeToggle />
            </div>
            {showForm ? (
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-primary text-center">Form Pengunjung PST</CardTitle>
                        <CardDescription className="text-center">
                            Badan Pusat Statistik Kabupaten Buton Selatan
                        </CardDescription>
                        {trackingStatus === "NOT_SUBMITTED" && (
                            <Alert className="bg-blue-50 mt-4 border-blue-200">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                                <AlertDescription className="text-blue-700">
                                    {trackingMessage}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Masukkan nama lengkap" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nomor Telepon</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Masukkan nomor telepon" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="institution"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Instansi (Opsional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Masukkan nama instansi" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email (Opsional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Masukkan alamat email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serviceId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Layanan</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih layanan" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {services.map((service) => (
                                                        <SelectItem key={service.id} value={service.id}>
                                                            {service.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Mengirim..." : "Kirim"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="text-muted-foreground text-sm text-center">
                        <p>
                            Silakan isi data diri Anda untuk mendapatkan nomor antrean layanan PST BPS Kabupaten Buton Selatan
                        </p>
                    </CardFooter>
                </Card>
            ) : (
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-primary">
                            <div className="bg-muted mx-auto rounded w-3/4 h-8 animate-pulse"></div>
                        </CardTitle>
                        <CardDescription>
                            <div className="bg-muted mt-2 rounded w-full h-6 animate-pulse"></div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-6 py-4">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                        <p className="mt-4 text-muted-foreground text-center">
                            Memeriksa informasi antrean...
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}