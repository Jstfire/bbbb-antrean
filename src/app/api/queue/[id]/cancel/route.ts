import { PrismaClient, QueueStatus, Role } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;

		// Get the queue
		const queue = await prisma.queue.findUnique({
			where: { id },
		});

		if (!queue) {
			return NextResponse.json({ error: "Queue not found" }, { status: 404 });
		}

		// Only waiting or serving queues can be canceled
		const allowedStatuses: QueueStatus[] = [QueueStatus.WAITING, QueueStatus.SERVING];
		if (!allowedStatuses.includes(queue.status)) {
			return NextResponse.json(
				{ error: "Queue cannot be canceled in its current state" },
				{ status: 400 }
			);
		}

		// If queue is being served, only the serving admin or a superadmin can cancel it
		if (
			queue.status === QueueStatus.SERVING &&
			session.user.role !== Role.SUPERADMIN &&
			queue.adminId !== session.user.id
		) {
			return NextResponse.json(
				{ error: "You are not authorized to cancel this queue" },
				{ status: 403 }
			);
		}

		// Update queue to canceled status
		const updatedQueue = await prisma.queue.update({
			where: { id },
			data: {
				status: QueueStatus.CANCELED,
				endTime: new Date(),
			},
			include: {
				visitor: {
					select: {
						name: true,
					},
				},
				service: {
					select: {
						name: true,
					},
				},
			},
		});

		return NextResponse.json({
			message: "Queue has been canceled",
			queue: updatedQueue,
		});
	} catch (error) {
		console.error("Error canceling queue:", error);
		return NextResponse.json(
			{ error: "Failed to cancel queue" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
