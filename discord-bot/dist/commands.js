import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
// Mirrors sfos-core/shared/constants.lua's fixed V1 permission catalog.
// Kept as fixed choices (not free text) to avoid typo'd permission strings
// granted from Discord ever reaching the database. Agency names match
// database/migrations/0003_agencies.sql's seed.
const PERMISSION_CHOICES = [
    { name: "LEO", value: "fmrp.role.police" },
    { name: "Fire & Rescue (SAFD)", value: "fmrp.role.fire" },
    { name: "EMS", value: "fmrp.role.stjohn" },
    { name: "Corrections", value: "fmrp.role.corrections" },
    { name: "Emergency Management", value: "fmrp.role.civildefence" },
    { name: "Staff: Agency HR (hire/fire/promote)", value: "fmrp.staff.hr" },
    { name: "Staff: Vehicles (givevehicle)", value: "fmrp.staff.vehicles" },
    { name: "Staff: AOP / Priority (/aop, /priority staff actions)", value: "fmrp.staff.aop" },
    { name: "Staff: Admin Menu (permissions, AOP, player actions, catalogs)", value: "fmrp.staff.admin" },
];
export const commands = [
    new SlashCommandBuilder()
        .setName("grant-permission")
        .setDescription("Grant a San Andreas role permission to a linked player")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption((option) => option.setName("player").setDescription("The Discord user").setRequired(true))
        .addStringOption((option) => option
        .setName("permission")
        .setDescription("Permission to grant")
        .setRequired(true)
        .addChoices(...PERMISSION_CHOICES))
        .toJSON(),
    new SlashCommandBuilder()
        .setName("revoke-permission")
        .setDescription("Revoke a San Andreas role permission from a linked player")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption((option) => option.setName("player").setDescription("The Discord user").setRequired(true))
        .addStringOption((option) => option
        .setName("permission")
        .setDescription("Permission to revoke")
        .setRequired(true)
        .addChoices(...PERMISSION_CHOICES))
        .toJSON(),
    new SlashCommandBuilder()
        .setName("lookup-player")
        .setDescription("Show a linked player's account, characters, and permissions")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption((option) => option.setName("player").setDescription("The Discord user").setRequired(true))
        .toJSON(),
];
