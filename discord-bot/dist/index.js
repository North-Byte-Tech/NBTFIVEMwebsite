import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { config } from "./config.js";
import { revokeDiscordWhitelist } from "./db.js";
import { revokeAllDiscordPermissions, syncMemberPermissions, syncMemberWhitelist, } from "./roleSync.js";
import { startLogHttpServer } from "./httpServer.js";
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    partials: [Partials.GuildMember],
});
client.once(Events.ClientReady, async (readyClient) => {
    console.log(`[nbt-discord-bot] logged in as ${readyClient.user.tag}`);
    if (!config.whitelist.discordRoleId) {
        console.warn("[nbt-discord-bot] DISCORD_WHITELIST_ROLE_ID is empty; whitelist role sync is disabled");
    }
    startLogHttpServer(readyClient);
    const guild = await readyClient.guilds.fetch(config.discordGuildId);
    const members = await guild.members.fetch();
    console.log(`[nbt-discord-bot] running initial role sync for ${members.size} members...`);
    for (const member of members.values()) {
        try {
            await Promise.all([syncMemberPermissions(member), syncMemberWhitelist(member)]);
        }
        catch (err) {
            console.error(`[nbt-discord-bot] failed initial sync for ${member.id}:`, err);
        }
    }
    console.log("[nbt-discord-bot] initial role sync complete");
});
client.on(Events.GuildMemberUpdate, async (_oldMember, newMember) => {
    try {
        const member = await newMember.fetch();
        await Promise.all([syncMemberPermissions(member), syncMemberWhitelist(member)]);
    }
    catch (err) {
        console.error(`[nbt-discord-bot] failed to sync ${newMember.id}:`, err);
    }
});
client.on(Events.GuildMemberRemove, async (member) => {
    try {
        await Promise.all([revokeAllDiscordPermissions(member.id), revokeDiscordWhitelist(member.id)]);
    }
    catch (err) {
        console.error(`[nbt-discord-bot] failed to revoke permissions for departing member ${member.id}:`, err);
    }
});
client.login(config.discordBotToken);
