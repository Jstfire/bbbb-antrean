"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QueueStatus } from "@/generated/prisma";
import { formatDistance } from "date-fns";
import { id } from "date-fns/locale";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, RefreshCw } from "lucide-react";

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

interface TablePaginationProps {
    totalItems: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

// TablePagination component for page controls
function TablePagination({ totalItems, pageSize, currentPage, onPageChange }: TablePaginationProps) {
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <div className="flex justify-between items-center mt-4 px-2">
            <div className="text-muted-foreground text-sm">
                Menampilkan {Math.min((currentPage - 1) * pageSize + 1, totalItems)} hingga {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} data
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                >
                    <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-2 text-sm">
                    Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronsRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export default function AllQueuesPage() {
    useSession();
    const [queues, setQueues] = useState<Queue[]>([]);
    const [filteredQueues, setFilteredQueues] = useState<Queue[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortColumn, setSortColumn] = useState<string>("queueNumber");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Dialog states
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);

    const fetchAllQueues = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/queue/all`);
            if (response.ok) {
                const data = await response.json();
                setQueues(data.queues);
                setLastUpdated(new Date());
            } else {
                toast.error("Gagal memuat data antrean");
            }
        } catch (error) {
            console.error("Error fetching queues:", error);
            toast.error("Terjadi kesalahan saat memuat data antrean");
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortQueues = useCallback(() => {
        let result = [...queues];

        // Apply status filter
        if (statusFilter !== "ALL") {
            result = result.filter(queue => queue.status === statusFilter);
        }

        // Apply search filter (search by visitor name, queue number, or service name)
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(
                queue =>
                    queue.visitor.name.toLowerCase().includes(search) ||
                    queue.queueNumber.toString().includes(search) ||
                    queue.service.name.toLowerCase().includes(search)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;

            if (sortColumn === "queueNumber") {
                comparison = a.queueNumber - b.queueNumber;
            } else if (sortColumn === "visitorName") {
                comparison = a.visitor.name.localeCompare(b.visitor.name);
            } else if (sortColumn === "serviceName") {
                comparison = a.service.name.localeCompare(b.service.name);
            } else if (sortColumn === "status") {
                comparison = a.status.localeCompare(b.status);
            } else if (sortColumn === "createdAt") {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }

            return sortDirection === "asc" ? comparison : -comparison;
        });

        setFilteredQueues(result);
        // Reset to first page when filters change
        setCurrentPage(1);
    }, [queues, searchTerm, statusFilter, sortColumn, sortDirection]);

    useEffect(() => {
        fetchAllQueues();

        // Refresh queue list every 30 seconds
        const interval = setInterval(() => {
            fetchAllQueues();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        filterAndSortQueues();
    }, [filterAndSortQueues]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            // Toggle direction if same column is clicked
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            // Set new column and default to ascending
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
    };

    const handlePageSizeChange = (value: string) => {
        setPageSize(parseInt(value, 10));
        setCurrentPage(1); // Reset to first page when page size changes
    };

    const handleRefresh = () => {
        fetchAllQueues();
        toast.success("Data antrean berhasil diperbarui");
    };

    const handleViewDetails = (queue: Queue) => {
        setSelectedQueue(queue);
        setShowDetailsDialog(true);
    };

    // Calculate pagination
    const paginatedQueues = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredQueues.slice(startIndex, startIndex + pageSize);
    }, [filteredQueues, currentPage, pageSize]);

    // Status badge helper
    const getStatusBadge = (status: QueueStatus) => {
        switch (status) {
            case "WAITING":
                return <span className="bg-yellow-100 px-2 py-1 rounded-full font-semibold text-yellow-800 text-xs">Menunggu</span>;
            case "SERVING":
                return <span className="bg-blue-100 px-2 py-1 rounded-full font-semibold text-blue-800 text-xs">Sedang Dilayani</span>;
            case "COMPLETED":
                return <span className="bg-green-100 px-2 py-1 rounded-full font-semibold text-green-800 text-xs">Selesai</span>;
            case "CANCELED":
                return <span className="bg-red-100 px-2 py-1 rounded-full font-semibold text-red-800 text-xs">Dibatalkan</span>;
            default:
                return <span className="bg-gray-100 px-2 py-1 rounded-full font-semibold text-gray-800 text-xs">Unknown</span>;
        }
    };

    // Duration/time helper
    const getQueueTimeInfo = (queue: Queue) => {
        switch (queue.status) {
            case "WAITING":
                return formatDistance(new Date(queue.createdAt), new Date(), {
                    addSuffix: false,
                    locale: id,
                });
            case "SERVING":
                return queue.admin?.name || "-";
            case "COMPLETED":
                return queue.endTime
                    ? new Date(queue.endTime).toLocaleTimeString("id-ID")
                    : "-";
            case "CANCELED":
                return "-";
            default:
                return "-";
        }
    };

    // Sort indicator helper
    const getSortIndicator = (column: string) => {
        if (sortColumn !== column) return null;
        return sortDirection === "asc" ? " ↑" : " ↓";
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="font-bold text-2xl">Semua Antrean</h1>
                <p className="text-muted-foreground">
                    Lihat dan cari semua antrean pengunjung PST
                </p>
            </div>


            <Card className="p-5">
                <div className="flex md:flex-row flex-col justify-between gap-4">

                    <div className="flex md:flex-row flex-col gap-4">
                        <div className="relative">
                            <Search className="top-2.5 left-2 absolute w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari antrean..."
                                className="pl-8 w-full md:w-[300px]"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Status</SelectItem>
                                <SelectItem value="WAITING">Menunggu</SelectItem>
                                <SelectItem value="SERVING">Sedang Dilayani</SelectItem>
                                <SelectItem value="COMPLETED">Selesai</SelectItem>
                                <SelectItem value="CANCELED">Dibatalkan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex md:flex-row flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="pageSize" className="text-sm whitespace-nowrap">
                                Tampilkan:
                            </Label>
                            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                                <SelectTrigger id="pageSize" className="w-[80px]">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCw className="mr-2 w-4 h-4" />
                            Perbarui
                        </Button>
                    </div>
                </div>
                <div className="text-muted-foreground text-xs">
                    Terakhir diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
                </div>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-8 text-center">Memuat data antrean...</div>
                    ) : filteredQueues.length === 0 ? (
                        <div className="py-8 text-center">Tidak ada antrean yang sesuai dengan filter</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort("queueNumber")}>
                                            No.{getSortIndicator("queueNumber")}
                                        </TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort("visitorName")}>
                                            Nama{getSortIndicator("visitorName")}
                                        </TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort("serviceName")}>
                                            Layanan{getSortIndicator("serviceName")}
                                        </TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                                            Status{getSortIndicator("status")}
                                        </TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                                            Waktu{getSortIndicator("createdAt")}
                                        </TableHead>
                                        <TableHead>Informasi</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedQueues.map((queue) => (
                                        <TableRow key={queue.id}>
                                            <TableCell className="font-medium">
                                                {queue.queueNumber}
                                            </TableCell>
                                            <TableCell>{queue.visitor.name}</TableCell>
                                            <TableCell>{queue.service.name}</TableCell>
                                            <TableCell>{getStatusBadge(queue.status)}</TableCell>
                                            <TableCell>
                                                {new Date(queue.createdAt).toLocaleTimeString("id-ID")}
                                            </TableCell>
                                            <TableCell>{getQueueTimeInfo(queue)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(queue)}
                                                >
                                                    Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {!loading && filteredQueues.length > 0 && (
                        <TablePagination
                            totalItems={filteredQueues.length}
                            pageSize={pageSize}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Queue Details Dialog */}
            {selectedQueue && (
                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Detail Antrean #{selectedQueue.queueNumber}</DialogTitle>
                        </DialogHeader>

                        <div className="gap-4 grid py-4">
                            <div className="items-center gap-4 grid grid-cols-3">
                                <Label>Status</Label>
                                <div className="col-span-2">{getStatusBadge(selectedQueue.status)}</div>
                            </div>

                            <div className="items-center gap-4 grid grid-cols-3">
                                <Label>Pengunjung</Label>
                                <div className="col-span-2">{selectedQueue.visitor.name}</div>
                            </div>

                            <div className="items-center gap-4 grid grid-cols-3">
                                <Label>Telepon</Label>
                                <div className="col-span-2">{selectedQueue.visitor.phone}</div>
                            </div>

                            {selectedQueue.visitor.institution && (
                                <div className="items-center gap-4 grid grid-cols-3">
                                    <Label>Institusi</Label>
                                    <div className="col-span-2">{selectedQueue.visitor.institution}</div>
                                </div>
                            )}

                            <div className="items-center gap-4 grid grid-cols-3">
                                <Label>Layanan</Label>
                                <div className="col-span-2">{selectedQueue.service.name}</div>
                            </div>

                            <div className="items-center gap-4 grid grid-cols-3">
                                <Label>Waktu Daftar</Label>
                                <div className="col-span-2">
                                    {new Date(selectedQueue.createdAt).toLocaleString("id-ID")}
                                </div>
                            </div>

                            {selectedQueue.startTime && (
                                <div className="items-center gap-4 grid grid-cols-3">
                                    <Label>Waktu Mulai</Label>
                                    <div className="col-span-2">
                                        {new Date(selectedQueue.startTime).toLocaleString("id-ID")}
                                    </div>
                                </div>
                            )}

                            {selectedQueue.endTime && (
                                <div className="items-center gap-4 grid grid-cols-3">
                                    <Label>Waktu Selesai</Label>
                                    <div className="col-span-2">
                                        {new Date(selectedQueue.endTime).toLocaleString("id-ID")}
                                    </div>
                                </div>
                            )}

                            {selectedQueue.admin && (
                                <div className="items-center gap-4 grid grid-cols-3">
                                    <Label>Petugas</Label>
                                    <div className="col-span-2">{selectedQueue.admin.name}</div>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                                Tutup
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
