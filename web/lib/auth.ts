import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { STAFF_ADMIN_PERMISSION } from "./permissions";

interface DiscordProfile {
  id: string;
  username: string;
  email: string | null;
  avatar: string | null;
  discriminator: string;
  image_url?: string;
}

// One-time bootstrap for the very first site admin: any Discord id listed
// here gets nbt.staff.admin (+ isStaff) granted on sign-in if it doesn't
// already have it. This only ever adds that one permission - it never
// removes permissions granted (or later revoked) through the admin UI, and
// it's safe to leave several trusted ids in here permanently, since it's
// additive and idempotent. Unlike the old portal-api-era bypass, there's no
// external system re-checking this - the website's own Postgres row IS the
// authority now, so keep this list to people you actually trust with admin.
function loadAdminBootstrapIds(): string[] {
  const raw = process.env.ADMIN_BOOTSTRAP_DISCORD_IDS;
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export const authOptions: NextAuthOptions = {
  // Postgres-backed website accounts DB - see prisma/schema.prisma's top
  // comment. This is the sole source of truth for accounts, applications,
  // staff, bans, notes, and permissions; there is no other backing service.
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      // Overrides the default profile() mapping purely to also carry
      // discordId through to the adapter's createUser call, so it lands on
      // our User model's discordId column at account creation - the
      // avatar/name/email mapping below is otherwise identical to
      // next-auth's built-in Discord provider.
      profile(profile: DiscordProfile) {
        const avatarNumber = Number(profile.discriminator) % 5;
        const imageUrl = profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${profile.avatar.startsWith("a_") ? "gif" : "png"}`
          : `https://cdn.discordapp.com/embed/avatars/${avatarNumber}.png`;
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: imageUrl,
          discordId: profile.id,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    // Without this, failed sign-ins hit next-auth's built-in generic error
    // screen, which has no branding and (more importantly) no visibility
    // into the underlying error code from a Vercel request log alone.
    error: "/auth/error",
  },
  logger: {
    // next-auth's default logger only prints to stdout/stderr with a plain
    // console.error, but the second arg it's given is often a full Error
    // (or an object wrapping one) with the real cause - e.g. an
    // OAuthCallbackError's `error.message` names the actual upstream
    // problem (bad client secret, redirect_uri mismatch, etc), which never
    // makes it into the "?error=Callback" query param the browser sees.
    error(code, metadata) {
      const cause = metadata instanceof Error ? metadata.message : metadata;
      console.error(`[next-auth] ${code}`, cause);
    },
  },
  events: {
    // Fires once per actual sign-in (not on every session read). Permissions
    // and isStaff are otherwise entirely admin-UI-managed state (see
    // lib/adminData.ts) that this must never overwrite - the only thing this
    // does is additively apply the bootstrap admin list above.
    async signIn({ user, account }) {
      if (account?.provider !== "discord") {
        return;
      }
      const discordId = account.providerAccountId;
      if (!loadAdminBootstrapIds().includes(discordId)) {
        return;
      }
      if (user.isStaff && user.permissions?.includes(STAFF_ADMIN_PERMISSION)) {
        return;
      }

      await prisma.user
        .update({
          where: { id: user.id },
          data: {
            isStaff: true,
            permissions: user.permissions?.includes(STAFF_ADMIN_PERMISSION)
              ? user.permissions
              : [...(user.permissions ?? []), STAFF_ADMIN_PERMISSION],
          },
        })
        .catch((error) => {
          console.error("Failed to apply admin bootstrap on sign-in", error);
        });
    },
  },
  callbacks: {
    async session({ session, user }) {
      session.discordId = user.discordId ?? null;
      session.userId = user.id;
      session.permissions = user.permissions ?? [];
      session.isStaff = user.isStaff ?? false;
      return session;
    },
  },
};
