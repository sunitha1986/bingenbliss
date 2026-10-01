const whatsappApiVersion = "v21.0";

function configured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_SENDER_NUMBER,
  );
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function toWhatsAppPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  return normalizedPhone.length === 10
    ? `91${normalizedPhone}`
    : normalizedPhone;
}

function winnerMessage(name) {
  return `Hello ${name},

Congratulations! You are the lucky winner of this month's Binge N Bliss draw.

We are delighted to welcome you to your winning moment. Please reply to this message or contact our team to claim your surprise.

Warmly,
Binge N Bliss`;
}

function chatLink(recipient, message) {
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}

export async function notifyLuckyDrawWinner(winner) {
  const message = winnerMessage(winner.Name);
  const directRecipient = toWhatsAppPhone(winner.Phone);
  const directLink =
    directRecipient.length >= 10 ? chatLink(directRecipient, message) : null;

  if (!configured()) {
    return { sent: false, skipped: true, chatLink: directLink };
  }

  const recipient = toWhatsAppPhone(winner.Phone);
  if (recipient.length < 10) {
    return { sent: false, skipped: true, reason: "Invalid recipient phone" };
  }

  const endpoint = `https://graph.facebook.com/${whatsappApiVersion}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = process.env.WHATSAPP_LOGO_URL
    ? {
        messaging_product: "whatsapp",
        to: recipient,
        type: "image",
        image: {
          link: process.env.WHATSAPP_LOGO_URL,
          caption: message,
        },
      }
    : {
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: message },
      };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || "WhatsApp API request failed");
    }
    return {
      sent: true,
      messageId: result.messages?.[0]?.id || null,
      chatLink: directLink,
    };
  } catch (error) {
    console.error("Unable to send lucky-draw WhatsApp message:", error.message);
    return { sent: false, reason: error.message, chatLink: directLink };
  }
}
