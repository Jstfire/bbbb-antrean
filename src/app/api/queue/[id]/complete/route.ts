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

		if (queue.status !== QueueStatus.SERVING) {
			return NextResponse.json(
				{ error: "Queue is not currently being served" },
				{ status: 400 }
			);
		}

		// Check if the current admin is the one who is serving this queue
		// Superadmins can complete any queue
		if (
			session.user.role !== Role.SUPERADMIN &&
			queue.adminId !== session.user.id
		) {
			return NextResponse.json(
				{ error: "You are not authorized to complete this queue" },
				{ status: 403 }
			);
		}

		// Update queue to completed status
		const updatedQueue = await prisma.queue.update({
			where: { id },
			data: {
				status: QueueStatus.COMPLETED,
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
			message: "Queue has been completed",
			queue: updatedQueue,
		});
	} catch (error) {
		console.error("Error completing queue:", error);
		return NextResponse.json(
			{ error: "Failed to complete queue" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
