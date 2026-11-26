import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface NotifyPayload {
  channel: "discord" | "telegram";
  webhookUrl?: string;
  botToken?: string;
  chatId?: string;
  useStoredConfig?: boolean;
  title: string;
  message: string;
}

const ALLOWED_ROLES = new Set(["desenvolvedor", "capitao", "cocapitao"]);

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase não configurado no servidor." },
        { status: 503 }
      );
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { ok: false, error: "Autenticação obrigatória para enviar notificações." },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      return NextResponse.json(
        { ok: false, error: "Sessão inválida ou expirada." },
        { status: 401 }
      );
    }

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("role, account_status")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (
      profErr ||
      !profile ||
      profile.account_status !== "approved" ||
      !ALLOWED_ROLES.has(String(profile.role))
    ) {
      return NextResponse.json(
        { ok: false, error: "Apenas Desenvolvedor, Capitão ou Co-Capitão podem disparar avisos." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as NotifyPayload;
    const title = String(body.title ?? "").trim().slice(0, 120);
    const message = String(body.message ?? "").trim().slice(0, 1500);

    if (!title || !message) {
      return NextResponse.json(
        { ok: false, error: "Título e mensagem obrigatórios." },
        { status: 400 }
      );
    }

    let webhookUrl = String(body.webhookUrl ?? "").trim();
    let botToken = String(body.botToken ?? "").trim();
    let chatId = String(body.chatId ?? "").trim();

    if (body.useStoredConfig || (!webhookUrl && body.channel === "discord") || ((!botToken || !chatId) && body.channel === "telegram")) {
      const { data: stored } = await supabase
        .from("team_notification_settings")
        .select("discord_webhook_url, telegram_bot_token, telegram_chat_id")
        .eq("id", 1)
        .maybeSingle();

      if (stored) {
        if (!webhookUrl && stored.discord_webhook_url) {
          webhookUrl = String(stored.discord_webhook_url).trim();
        }
        if (!botToken && stored.telegram_bot_token) {
          botToken = String(stored.telegram_bot_token).trim();
        }
        if (!chatId && stored.telegram_chat_id) {
          chatId = String(stored.telegram_chat_id).trim();
        }
      }
    }

    if (body.channel === "discord") {
      if (
        !webhookUrl.startsWith("https://discord.com/api/webhooks/") &&
        !webhookUrl.startsWith("https://discordapp.com/api/webhooks/")
      ) {
        return NextResponse.json(
          { ok: false, error: "Webhook do Discord inválido." },
          { status: 400 }
        );
      }

      const res = await fetch(webhookUrl, {
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
      if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(botToken) || !chatId) {
        return NextResponse.json(
          { ok: false, error: "Bot Token ou Chat ID do Telegram inválido." },
          { status: 400 }
        );
      }

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
