import { NextResponse } from "next/server";

interface NotifyPayload {
  channel: "discord" | "telegram";
  webhookUrl?: string;
  botToken?: string;
  chatId?: string;
  title: string;
  message: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NotifyPayload;
    const title = String(body.title ?? "").trim().slice(0, 120);
    const message = String(body.message ?? "").trim().slice(0, 1500);

    if (!title || !message) {
      return NextResponse.json({ ok: false, error: "Título e mensagem obrigatórios." }, { status: 400 });
    }

    if (body.channel === "discord") {
      const url = String(body.webhookUrl ?? "").trim();
      if (
        !url.startsWith("https://discord.com/api/webhooks/") &&
        !url.startsWith("https://discordapp.com/api/webhooks/")
      ) {
        return NextResponse.json(
          { ok: false, error: "Webhook do Discord inválido." },
          { status: 400 }
        );
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `**⚡ ${title}**\n${message}`,
        }),
      });

      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: `Discord retornou HTTP ${res.status}` },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (body.channel === "telegram") {
      const token = String(body.botToken ?? "").trim();
      const chatId = String(body.chatId ?? "").trim();
      if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token) || !chatId) {
        return NextResponse.json(
          { ok: false, error: "Bot Token ou Chat ID do Telegram inválido." },
          { status: 400 }
        );
      }

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⚡ ${title}\n\n${message}`,
        }),
      });

      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: `Telegram retornou HTTP ${res.status}` },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Canal não suportado." }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro ao enviar notificação." }, { status: 500 });
  }
}
