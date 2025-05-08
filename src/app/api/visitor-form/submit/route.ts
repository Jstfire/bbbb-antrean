import { PrismaClient, QueueStatus } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();
		const { name, phone, institution, email, serviceId, tempUuid } = data;

		// Validate required fields
		if (!name || !phone || !serviceId || !tempUuid) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Check if tempUuid is valid and not used
		const tempVisitorLink = await prisma.tempVisitorLink.findUnique({
			where: { uuid: tempUuid },
		});

		if (!tempVisitorLink) {
			return NextResponse.json(
				{ error: "Invalid temporary link" },
				{ status: 400 }
			);
		}

		if (tempVisitorLink.used) {
			return NextResponse.json(
				{ error: "This form has already been submitted" },
				{ status: 400 }
			);
		}

		// Check if link is expired
		if (new Date() > tempVisitorLink.expiresAt) {
			return NextResponse.json({ error: "Link has expired" }, { status: 400 });
		}

		// Get the latest queue number for today
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const latestQueue = await prisma.queue.findFirst({
			where: {
				createdAt: {
					gte: today,
				},
			},
			orderBy: {
				queueNumber: "desc",
			},
		});

		const nextQueueNumber = latestQueue ? latestQueue.queueNumber + 1 : 1;

		// Transaction to create visitor and queue
		const result = await prisma.$transaction(async (tx) => {
			// Create visitor
			const visitor = await tx.visitor.create({
				data: {
					name,
					phone,
					institution,
					email,
				},
			});

			// Create queue
			const queue = await tx.queue.create({
				data: {
					queueNumber: nextQueueNumber,
					status: QueueStatus.WAITING,
					visitorId: visitor.id,
					serviceId,
					tempUuid: tempUuid,
				},
				include: {
					service: true,
				},
			});

			// Mark temp link as used
			await tx.tempVisitorLink.update({
				where: { uuid: tempUuid },
				data: { used: true },
			});

			return { visitor, queue };
		});

		return NextResponse.json({
			success: true,
			message: "Queue created successfully",
			data: {
				queueNumber: result.queue.queueNumber,
				serviceName: result.queue.service.name,
				visitorName: result.visitor.name,
			},
		});
	} catch (error) {
		console.error("Error submitting visitor form:", error);
		return NextResponse.json(
			{ error: "Failed to process visitor form" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
