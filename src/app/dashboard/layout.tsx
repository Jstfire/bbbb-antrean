"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Settings,
    LogOut,
    BarChart4,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Role } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession(); const navItems = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboard size={20} />,
            allowedRoles: [Role.ADMIN, Role.SUPERADMIN],
        },
        {
            title: "Antrean",
            href: "/dashboard/queue",
            icon: <ClipboardList size={20} />,
            allowedRoles: [Role.ADMIN, Role.SUPERADMIN],
        },
        {
            title: "Semua Antrean",
            href: "/dashboard/all-queues",
            icon: <ClipboardList size={20} />,
            allowedRoles: [Role.ADMIN, Role.SUPERADMIN],
        },
        {
            title: "Analisis",
            href: "/dashboard/analytics",
            icon: <BarChart4 size={20} />,
            allowedRoles: [Role.ADMIN, Role.SUPERADMIN],
        },
        {
            title: "Kelola Admin",
            href: "/dashboard/users",
            icon: <Users size={20} />,
            allowedRoles: [Role.SUPERADMIN],
        },
        {
            title: "Kelola Layanan",
            href: "/dashboard/services",
            icon: <Settings size={20} />,
            allowedRoles: [Role.SUPERADMIN],
        },
    ];

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const handleSignOut = () => {
        signOut({ callbackUrl: "/" });
    };

    return (
        <div className="flex md:flex-row flex-col h-screen">
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                className="md:hidden top-4 right-4 z-50 fixed"
                onClick={toggleSidebar}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>

            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-sidebar text-sidebar-background w-full md:w-64 md:min-h-screen transition-all duration-300 ease-in-out",
                    isOpen ? "block fixed inset-0 z-40" : "hidden md:block"
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-sidebar-border border-b">
                        <h1 className="mb-1 font-bold text-2xl text-center">PST BPS</h1>
                        <p className="text-xs text-center">Buton Selatan</p>
                    </div>

                    <div className="flex flex-col flex-grow space-y-2 p-4">
                        {navItems
                            .filter((item) =>
                                item.allowedRoles.includes(session?.user?.role || Role.ADMIN)
                            )
                            .map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
                                        pathname === item.href
                                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                            : "hover:bg-sidebar-accent/30"
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.title}</span>
                                </Link>
                            ))}
                    </div>                    <div className="p-4 border-sidebar-border border-t">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <p className="font-medium">{session?.user?.name}</p>
                                <p className="text-sidebar-foreground/70 text-xs">
                                    {session?.user?.role === Role.SUPERADMIN ? "Super Admin" : "Admin"}
                                </p>
                            </div>
                            <ThemeToggle />
                        </div>
                        <Button
                            variant="outline"
                            className="flex items-center space-x-2 w-full"
                            onClick={handleSignOut}
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 bg-background overflow-auto">
                <div className="p-6 min-h-screen">{children}</div>
            </main>
        </div>
    );
}