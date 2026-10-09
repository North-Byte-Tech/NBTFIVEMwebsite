export type RecruitmentDiscordEvent =
  | "application_submitted"
  | "interview_scheduled"
  | "interview_completed"
  | "awaiting_final_decision"
  | "application_accepted"
  | "application_rejected";

export async function emitRecruitmentBotEvent(
  event: RecruitmentDiscordEvent,
  payload: Record<string, string | number | boolean | null | undefined>,
): Promise<void> {
  const baseUrl = (process.env.DISCORD_BOT_WEBHOOK_URL ?? process.env.DISCORD_BOT_BASE_URL ?? "http://localhost:30121").replace(/\/$/, "");
  const secret = process.env.DISCORD_BOT_WEBHOOK_SECRET ?? process.env.FXSERVER_LOG_SECRET ?? "";

  if (!secret) {
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/recruitment/${event}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sfos-log-secret": secret,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn(`[fmrp-web] Discord bot rejected ${event} notification: HTTP ${response.status}`);
    }
  } catch (err) {
    console.warn(`[fmrp-web] failed to notify Discord bot for ${event}:`, err);
  }
}
