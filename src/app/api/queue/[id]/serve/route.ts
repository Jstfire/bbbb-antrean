import { PrismaClient, QueueStatus } from "@/generated/prisma";
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

		if (queue.status !== QueueStatus.WAITING) {
			return NextResponse.json(
				{ error: "Queue is not in waiting status" },
				{ status: 400 }
			);
		}

		// Update queue to serving status
		const updatedQueue = await prisma.queue.update({
			where: { id },
			data: {
				status: QueueStatus.SERVING,
				startTime: new Date(),
				adminId: session.user.id,
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
			message: "Queue is now being served",
			queue: updatedQueue,
		});
	} catch (error) {
		console.error("Error serving queue:", error);
		return NextResponse.json(
			{ error: "Failed to serve queue" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
