"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QueueStatus, Role } from "@/generated/prisma";
import { formatDistance } from "date-fns";
import { id } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Queue {
    id: string;
    queueNumber: number;
    status: QueueStatus;
    createdAt: string;
    startTime: string | null;
    endTime: string | null;
    visitor: {
        name: string;
        phone: string;
        institution: string | null;
    };
    service: {
        name: string;
    };
    admin: {
        name: string;
    } | null;
}

export default function QueueManagementPage() {
    const { data: session } = useSession();
    const [queues, setQueues] = useState<Queue[]>([]);
    const [activeTab, setActiveTab] = useState<QueueStatus>("WAITING");
    const [loading, setLoading] = useState(true);
    const [showContinueDialog, setShowContinueDialog] = useState(false);
    const [nextInQueue, setNextInQueue] = useState<Queue | null>(null);

    useEffect(() => {
        fetchQueues(activeTab);

        // Refresh queue list every 30 seconds
        const interval = setInterval(() => {
            fetchQueues(activeTab);
        }, 30000);

        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchQueues = async (status: QueueStatus) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/queue?status=${status}`);
            if (response.ok) {
                const data = await response.json();
                setQueues(data.queues);
            } else {
                toast.error("Gagal memuat daftar antrean");
            }
        } catch (error) {
            console.error("Error fetching queues:", error);
            toast.error("Terjadi kesalahan saat memuat antrean");
        } finally {
            setLoading(false);
        }
    };

    const handleServeQueue = async (queueId: string) => {
        try {
            const response = await fetch(`/api/queue/${queueId}/serve`, {
                method: "POST",
            });

            if (response.ok) {
                toast.success("Antrean sedang dilayani");
                fetchQueues(activeTab);
            } else {
                const data = await response.json();
                toast.error(data.error || "Gagal memulai pelayanan antrean");
            }
        } catch (error) {
            console.error("Error serving queue:", error);
            toast.error("Terjadi kesalahan");
        }
    };

    const handleCompleteQueue = async (queueId: string) => {
        try {
            const response = await fetch(`/api/queue/${queueId}/complete`, {
                method: "POST",
            });

            if (response.ok) {
                toast.success("Antrean telah selesai dilayani");

                // Check if there are waiting customers to offer continuing service
                const waitingResponse = await fetch(`/api/queue?status=WAITING`);
                if (waitingResponse.ok) {
                    const data = await waitingResponse.json();
                    if (data.queues.length > 0) {
                        // Get the next customer in queue (first waiting)
                        const nextCustomer = data.queues[0];
                        setNextInQueue(nextCustomer);
                        setShowContinueDialog(true);
                    }
                }

                fetchQueues(activeTab);
            } else {
                const data = await response.json();
                toast.error(data.error || "Gagal menyelesaikan antrean");
            }
        } catch (error) {
            console.error("Error completing queue:", error);
            toast.error("Terjadi kesalahan");
        }
    };

    const handleCancelQueue = async (queueId: string) => {
        try {
            const response = await fetch(`/api/queue/${queueId}/cancel`, {
                method: "POST",
            });

            if (response.ok) {
                toast.success("Antrean telah dibatalkan");
                fetchQueues(activeTab);
            } else {
                const data = await response.json();
                toast.error(data.error || "Gagal membatalkan antrean");
            }
        } catch (error) {
            console.error("Error canceling queue:", error);
            toast.error("Terjadi kesalahan");
        }
    };

    const getWaitingTime = (createdAt: string) => {
        try {
            return formatDistance(new Date(createdAt), new Date(), {
                addSuffix: false,
                locale: id,
            });
        } catch (error) {
            console.log("Error formatting date:", error);

            return "-";
        }
    };

    const getActionButtons = (queue: Queue) => {
        const isSuperAdmin = session?.user?.role === Role.SUPERADMIN;

        switch (queue.status) {
            case "WAITING":
                return (
                    <div className="flex space-x-2">
                        <Button
                            size="sm"
                            onClick={() => handleServeQueue(queue.id)}
                        >
                            Layani
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelQueue(queue.id)}
                        >
                            Batalkan
                        </Button>
                    </div>
                );
            case "SERVING":
                // Only show complete button if the current admin is serving this queue or is superadmin
                if (
                    isSuperAdmin ||
                    (queue.admin && queue.admin.name === session?.user?.name)
                ) {
                    return (
                        <Button
                            size="sm"
                            onClick={() => handleCompleteQueue(queue.id)}
                        >
                            Selesai
                        </Button>
                    );
                }
                return <span>Sedang dilayani oleh {queue.admin?.name}</span>;
            default:
                return null;
        }
    };

    // const handleContinue = (queue: Queue) => {
    //     setNextInQueue(queue);
    //     setShowContinueDialog(true);
    // };

    const handleDialogClose = () => {
        setShowContinueDialog(false);
        setNextInQueue(null);
    };

    const handleNextCustomer = async () => {
        if (!nextInQueue) return;

        try {
            const response = await fetch(`/api/queue/${nextInQueue.id}/serve`, {
                method: "POST",
            });

            if (response.ok) {
                toast.success("Antrean sedang dilayani");
                fetchQueues(activeTab);
            } else {
                const data = await response.json();
                toast.error(data.error || "Gagal memulai pelayanan antrean");
            }
        } catch (error) {
            console.error("Error serving queue:", error);
            toast.error("Terjadi kesalahan");
        } finally {
            handleDialogClose();
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="font-bold text-2xl">Manajemen Antrean</h1>
                <p className="text-muted-foreground">
                    Kelola antrean pengunjung PST
                </p>
            </div>

            <Tabs defaultValue="WAITING" onValueChange={(value) => setActiveTab(value as QueueStatus)}>
                <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="WAITING">Menunggu</TabsTrigger>
                    <TabsTrigger value="SERVING">Sedang Dilayani</TabsTrigger>
                    <TabsTrigger value="COMPLETED">Selesai</TabsTrigger>
                </TabsList>

                {["WAITING", "SERVING", "COMPLETED"].map((status) => (
                    <TabsContent key={status} value={status}>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {status === "WAITING" && "Antrean Menunggu"}
                                    {status === "SERVING" && "Antrean Sedang Dilayani"}
                                    {status === "COMPLETED" && "Antrean Selesai"}
                                </CardTitle>
                                <CardDescription>
                                    {status === "WAITING" && "Daftar pengunjung yang sedang menunggu untuk dilayani"}
                                    {status === "SERVING" && "Daftar pengunjung yang sedang dalam proses pelayanan"}
                                    {status === "COMPLETED" && "Daftar pengunjung yang telah selesai dilayani"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="py-4 text-center">Memuat data antrean...</div>
                                ) : queues.length === 0 ? (
                                    <div className="py-4 text-center">Tidak ada antrean saat ini</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>No.</TableHead>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>Layanan</TableHead>
                                                    <TableHead>
                                                        {status === "WAITING" && "Waktu Menunggu"}
                                                        {status === "SERVING" && "Petugas"}
                                                        {status === "COMPLETED" && "Waktu Selesai"}
                                                    </TableHead>
                                                    <TableHead>Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {queues.map((queue) => (
                                                    <TableRow key={queue.id}>
                                                        <TableCell className="font-medium">
                                                            {queue.queueNumber}
                                                        </TableCell>
                                                        <TableCell>{queue.visitor.name}</TableCell>
                                                        <TableCell>{queue.service.name}</TableCell>
                                                        <TableCell>
                                                            {status === "WAITING" && getWaitingTime(queue.createdAt)}
                                                            {status === "SERVING" && queue.admin?.name}
                                                            {status === "COMPLETED" && new Date(queue.endTime!).toLocaleTimeString("id-ID")}
                                                        </TableCell>
                                                        <TableCell>{getActionButtons(queue)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Dialog for continue serving next customer */}
            {nextInQueue && (
                <Dialog open={showContinueDialog} onOpenChange={handleDialogClose}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Layani Pelanggan Berikutnya</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                            Apakah Anda yakin ingin melanjutkan dan melayani pelanggan berikutnya
                            <br />
                            <strong>{nextInQueue.visitor.name}</strong>?
                        </DialogDescription>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleDialogClose}>
                                Tidak
                            </Button>
                            <Button onClick={handleNextCustomer}>
                                Ya, Layani
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}