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

		// Get all unread notifications
		const notifications = await prisma.notification.findMany({
			where: {
				isRead: false,
				// If the notification has a userId, it should match the current user
				// Otherwise, notifications with null userId are visible to all users
				OR: [{ userId: null }, { userId: session.user.id }],
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 20, // Limit to 20 most recent notifications
		});

		return NextResponse.json({ notifications });
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return NextResponse.json(
			{ error: "Failed to fetch notifications" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}

export async function POST() {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Mark all notifications for the current user as read
		await prisma.notification.updateMany({
			where: {
				isRead: false,
				OR: [{ userId: null }, { userId: session.user.id }],
			},
			data: {
				isRead: true,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error marking notifications as read:", error);
		return NextResponse.json(
			{ error: "Failed to mark notifications as read" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
