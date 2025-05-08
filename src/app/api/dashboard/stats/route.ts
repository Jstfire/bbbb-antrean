import { PrismaClient, QueueStatus } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
	try {
		// Check authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get the start of today
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Get queue counts by status for today
		const waitingCount = await prisma.queue.count({
			where: {
				status: QueueStatus.WAITING,
				createdAt: {
					gte: today,
				},
			},
		});

		const servingCount = await prisma.queue.count({
			where: {
				status: QueueStatus.SERVING,
				createdAt: {
					gte: today,
				},
			},
		});

		const completedCount = await prisma.queue.count({
			where: {
				status: QueueStatus.COMPLETED,
				createdAt: {
					gte: today,
				},
			},
		});

		const canceledCount = await prisma.queue.count({
			where: {
				status: QueueStatus.CANCELED,
				createdAt: {
					gte: today,
				},
			},
		});

		const totalCount =
			waitingCount + servingCount + completedCount + canceledCount;

		// Calculate average wait time (from creation to serving start)
		const completedQueues = await prisma.queue.findMany({
			where: {
				status: {
					in: [QueueStatus.COMPLETED, QueueStatus.SERVING],
				},
				createdAt: {
					gte: today,
				},
				startTime: {
					not: null,
				},
			},
			select: {
				createdAt: true,
				startTime: true,
				endTime: true,
			},
		});

		let totalWaitTimeMs = 0;
		let totalServiceTimeMs = 0;
		let waitCount = 0;
		let serviceCount = 0;

		completedQueues.forEach((queue) => {
			if (queue.startTime) {
				// Calculate wait time
				const waitTimeMs =
					new Date(queue.startTime).getTime() -
					new Date(queue.createdAt).getTime();
				totalWaitTimeMs += waitTimeMs;
				waitCount++;

				// Calculate service time for completed queues
				if (queue.endTime) {
					const serviceTimeMs =
						new Date(queue.endTime).getTime() -
						new Date(queue.startTime).getTime();
					totalServiceTimeMs += serviceTimeMs;
					serviceCount++;
				}
			}
		});

		// Calculate averages in minutes
		const avgWaitTimeMinutes =
			waitCount > 0 ? Math.round(totalWaitTimeMs / waitCount / (1000 * 60)) : 0;

		const avgServiceTimeMinutes =
			serviceCount > 0
				? Math.round(totalServiceTimeMs / serviceCount / (1000 * 60))
				: 0;

		return NextResponse.json({
			counts: {
				waiting: waitingCount,
				serving: servingCount,
				completed: completedCount,
				canceled: canceledCount,
				total: totalCount,
			},
			averages: {
				waitTimeMinutes: avgWaitTimeMinutes,
				serviceTimeMinutes: avgServiceTimeMinutes,
			},
		});
	} catch (error) {
		console.error("Error fetching dashboard stats:", error);
		return NextResponse.json(
			{ error: "Failed to fetch statistics" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
