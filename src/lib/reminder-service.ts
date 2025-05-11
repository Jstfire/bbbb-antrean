import { checkWhatsAppBotEnv } from "./env-checker";

export interface ReminderResponse {
	success: boolean;
	message: string;
	data?: unknown;
}

/**
 * Sends a reminder via WhatsApp direct link
 * @param phoneNumber The recipient phone number
 * @param message The message to send
 * @returns Response with success status and URL
 */
export async function sendWhatsAppDirectReminder(
	phoneNumber: string,
	message: string
): Promise<ReminderResponse> {
	try {
		// Clean phone number
		let cleanNumber = phoneNumber.replace(/\s+/g, "");
		if (cleanNumber.startsWith("+62")) {
			cleanNumber = cleanNumber.substring(1); // Remove the + sign
		} else if (cleanNumber.startsWith("0")) {
			cleanNumber = "62" + cleanNumber.substring(1);
		} else if (!cleanNumber.startsWith("62")) {
			cleanNumber = "62" + cleanNumber;
		}

		// Create WhatsApp URL
		const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
			message
		)}`;

		return {
			success: true,
			message: "WhatsApp reminder link prepared",
			data: { whatsappUrl, phoneNumber: cleanNumber },
		};
	} catch (error) {
		console.error("Error preparing WhatsApp direct reminder:", error);
		return {
			success: false,
			message: "Gagal menyiapkan pengingat via WhatsApp direct",
		};
	}
}

/**
 * Sends a reminder via WhatsApp Bot API
 * @param phoneNumber The recipient phone number
 * @param message The message to send
 * @returns Response with success status
 */
export async function sendWhatsAppBotReminder(
	phoneNumber: string,
	message: string
): Promise<ReminderResponse> {
	try {
		// Check env variables
		const envCheck = checkWhatsAppBotEnv();
		if (!envCheck.isValid) {
			return {
				success: false,
				message: envCheck.message,
			};
		}

		// Clean phone number
		let cleanNumber = phoneNumber.replace(/\s+/g, "");
		if (cleanNumber.startsWith("+62")) {
			cleanNumber = cleanNumber.substring(1); // Remove the + sign
		} else if (cleanNumber.startsWith("0")) {
			cleanNumber = "62" + cleanNumber.substring(1);
		} else if (!cleanNumber.startsWith("62")) {
			cleanNumber = "62" + cleanNumber;
		}

		// First check if the number exists on WhatsApp
		const apiUrl = process.env.NEXT_PUBLIC_WA_API_URL!;
		const adminKey = process.env.NEXT_PUBLIC_WA_ADMIN_KEY!;

		// Get token first
		const tokenResponse = await fetch(`${apiUrl}/api/tokens/generate`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				adminKey: adminKey,
				name: "BPS Buton Selatan SKD Reminder",
			}),
		});

		const tokenData = await tokenResponse.json();
		if (!tokenData.success || !tokenData.token) {
			return {
				success: false,
				message: `Gagal mendapatkan token: ${
					tokenData.message || "Unknown error"
				}`,
			};
		}

		const token = tokenData.token;

		// Check if number exists on WhatsApp
		const checkResponse = await fetch(`${apiUrl}/api/check-number`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				number: cleanNumber,
			}),
		});

		const checkData = await checkResponse.json();
		if (!checkData.success) {
			return {
				success: false,
				message: `Gagal memeriksa nomor: ${checkData.message}`,
			};
		}

		if (!checkData.exists) {
			return {
				success: false,
				message: `Nomor ${phoneNumber} tidak terdaftar di WhatsApp`,
			};
		}

		// If number exists, send the message
		const messageResponse = await fetch(`${apiUrl}/api/send-message`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				number: cleanNumber,
				message: message,
			}),
		});

		const messageData = await messageResponse.json();
		if (!messageData.success) {
			return {
				success: false,
				message: `Gagal mengirim pesan: ${messageData.message}`,
			};
		}

		return {
			success: true,
			message: `Pesan berhasil dikirim ke ${cleanNumber}`,
			data: { messageData },
		};
	} catch (error) {
		console.error("Error sending WhatsApp bot reminder:", error);
		return {
			success: false,
			message: "Terjadi kesalahan saat mengirim pesan via WhatsApp Bot",
		};
	}
}
