import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get today's date (start of day)
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Get all queues for today, without filtering by status
		const queues = await prisma.queue.findMany({
			where: {
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
		console.error("Error fetching all queues:", error);
		return NextResponse.json(
			{ error: "Failed to fetch queues" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
