import { PrismaClient } from "@/generated/prisma";
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

		const notificationId = params.id;

		// Mark the specific notification as read
		const updatedNotification = await prisma.notification.update({
			where: {
				id: notificationId,
				OR: [{ userId: null }, { userId: session.user.id }],
			},
			data: {
				isRead: true,
			},
		});

		if (!updatedNotification) {
			return NextResponse.json(
				{ error: "Notification not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Notification marked as read",
		});
	} catch (error) {
		console.error("Error marking notification as read:", error);
		return NextResponse.json(
			{ error: "Failed to mark notification as read" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
