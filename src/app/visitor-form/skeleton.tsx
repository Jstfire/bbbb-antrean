"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SkeletonForm() {
    return (
        <div className="flex justify-center items-center bg-background p-4 min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-primary">
                        <div className="h-8 w-3/4 mx-auto bg-muted animate-pulse rounded"></div>
                    </CardTitle>
                    <CardDescription>
                        <div className="h-6 w-full bg-muted animate-pulse rounded mt-2"></div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6 py-4">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="w-full space-y-8">
                        <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
                        <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
                        <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
                        <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
                    </div>
                    <p className="text-muted-foreground text-center mt-4">
                        Memuat data, mohon tunggu sebentar...
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
