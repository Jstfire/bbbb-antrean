"use client";

import { useEffect, useState, use } from "react";
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

interface Service {
    id: string;
    name: string;
    status: ServiceStatus;
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
    const [isLoading, setIsLoading] = useState(false);
    const [isValid, setIsValid] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [queueInfo, setQueueInfo] = useState<{
        queueNumber: number;
        serviceName: string;
        visitorName: string;
    } | null>(null);

    // Get the UUID from params using React.use()
    const { uuid } = use(params);
    console.log("UUID from params:", uuid);


    const form = useForm<VisitorFormValues>({
        resolver: zodResolver(visitorFormSchema),
        defaultValues: {
            name: "",
            phone: "",
            institution: "",
            email: "",
            serviceId: "",
        },
    });

    useEffect(() => {
        // Validate UUID and fetch services
        const validateUuid = async () => {
            try {
                // First, check if UUID is valid by fetching services

                const response = await fetch(`/api/visitor-form/${uuid}`, {
                    headers: {
                        "x-visitor-uuid": uuid,
                    },
                });

                if (response.status === 200) {
                    const data = await response.json();
                    // console.log("Response isi:", response.json());

                    window.location.href = "/visitor-form/".concat(data.dynamicUuid);
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
                    } else {
                        setIsValid(false);
                        toast.error("Link tidak valid atau sudah kedaluwarsa");
                    }
                }
            } catch (error) {
                console.error("Error validating UUID:", error);
                setIsValid(false);
                toast.error("Terjadi kesalahan, silakan coba lagi");
            }
        };

        if (uuid) {
            validateUuid();
        }
    }, [uuid]);

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

            const result = await response.json();

            if (response.ok) {
                setQueueInfo(result.data);
                setIsSubmitted(true);
                toast.success("Formulir berhasil dikirim");
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
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center bg-background p-4 min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-primary text-center">Form Pengunjung PST</CardTitle>
                    <CardDescription className="text-center">
                        Badan Pusat Statistik Kabupaten Buton Selatan
                    </CardDescription>
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
        </div>
    );
}