import { PrismaClient, QueueStatus } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get status query parameter
		const url = new URL(req.url);
		const statusParam = url.searchParams.get("status") as QueueStatus | null;

		// Default to WAITING if no status provided
		const status = statusParam || QueueStatus.WAITING;

		// Get today's date (start of day)
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Get queues with the specified status for today
		const queues = await prisma.queue.findMany({
			where: {
				status,
				createdAt: {
					gte: today,
				},
			},
			include: {
				visitor: {
					select: {
						name: true,
						phone: true,
						institution: true,
					},
				},
				service: {
					select: {
						name: true,
					},
				},
				admin: {
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				queueNumber: "asc",
			},
		});

		return NextResponse.json({ queues });
	} catch (error) {
		console.error("Error fetching queues:", error);
		return NextResponse.json(
			{ error: "Failed to fetch queues" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
