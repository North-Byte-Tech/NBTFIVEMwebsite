import express from "express";
import { Client } from "discord.js";
import { config } from "./config.js";

export function startLogHttpServer(client: Client): void {
  const app = express();
  app.use(express.json());

  // Unauthenticated liveness probe for the website's Dev Dashboard - reports
  // only whether the process is up and logged in to Discord.
  app.get("/health", (_req, res) => {
    res.json({ ok: true, discordReady: client.isReady() });
  });

  app.post("/recruitment/:event", async (req, res) => {
    const providedSecret = req.header("x-sfos-log-secret");
    const recruitmentSecret = config.recruitment.eventSecret;
    if (!recruitmentSecret || providedSecret !== recruitmentSecret) {
      res.status(401).json({ ok: false, error: "unauthorized" });
      return;
    }

    const event = req.params.event as string;
    const payload = req.body as Record<string, unknown>;

    try {
      await handleRecruitmentEvent(client, event, payload);
      res.json({ ok: true });
    } catch (err) {
      console.error(`[httpServer] recruitment event failed: event=${event}`, err);
      res.status(500).json({ ok: false, error: "internal_error" });
    }
  });

  app.listen(config.bot.httpPort, () => {
    console.log(`[fmrp-discord-bot] recruitment HTTP server listening on port ${config.bot.httpPort}`);
  });
}

async function handleRecruitmentEvent(client: Client, event: string, payload: Record<string, unknown>): Promise<void> {
  const discordId = typeof payload.discordId === "string" ? payload.discordId : null;
  const department = typeof payload.department === "string" ? payload.department : "";
  const username = typeof payload.discordUsername === "string" ? payload.discordUsername : "applicant";
  const interviewDate = typeof payload.interviewDate === "string" ? payload.interviewDate : null;
  const messageText = typeof payload.message === "string" ? payload.message : null;

  if (!discordId) {
    return;
  }

  const user = await client.users.fetch(discordId).catch(() => null);
  if (!user) {
    return;
  }

  switch (event) {
    case "application_submitted":
      await user.send(`Thanks for applying to the ${department || "department"} recruitment team, ${username}! Your application has been received and staff will review it shortly.`);
      break;
    case "interview_scheduled":
      await user.send(`Your interview for ${department || "the department"} has been scheduled for ${interviewDate ?? "your selected time"}. Please keep an eye on Discord for updates.`);
      break;
    case "interview_completed":
      await user.send("Your interview has been completed. The department is reviewing your application and leadership will make the final decision.");
      break;
    case "awaiting_final_decision":
      await user.send("Your application has moved to leadership for the final decision. We will let you know the outcome as soon as it is approved or rejected.");
      break;
    case "application_accepted": {
      const departmentKey = department.trim().toUpperCase();
      const roleIds = Object.entries(config.recruitment.roleIds)
        .filter(([key]) => key === departmentKey)
        .map(([, value]) => value)
        .filter((value): value is string => Boolean(value));

      let acceptanceMessage = `Congratulations! Your application for ${department || "the department"} has been accepted. Welcome aboard.`;
      if (config.recruitment.mainDiscordInviteUrl) {
        acceptanceMessage += `\n\nYour final step is to join the main Discord server: ${config.recruitment.mainDiscordInviteUrl}`;
      }

      await user.send(acceptanceMessage);

      if (roleIds.length > 0) {
        const guild = await client.guilds.fetch(config.discordGuildId).catch(() => null);
        if (guild) {
          const member = await guild.members.fetch(discordId).catch(() => null);
          if (member) {
            await member.roles.add(roleIds);
          }
        }
      }
      break;
    }
    case "application_rejected":
      await user.send(`Thanks for taking the time to apply to ${department || "the department"}. After review, we have decided not to move forward with your application this time. We wish you the very best.`);
      break;
    default:
      if (messageText) {
        await user.send(messageText);
      }
      break;
  }
}
