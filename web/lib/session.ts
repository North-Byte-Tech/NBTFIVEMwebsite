import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import type { Session } from "next-auth";
import { authOptions } from "./auth";
import { DEVELOPER_PERMISSION, STAFF_ADMIN_PERMISSION } from "./permissions";

// True whenever getSession() below hands back the fixed DEV_SESSION instead
// of a real one - layout.tsx reads this to show a small "fake session"
// banner so the bypass is never mistaken for an actual sign-in.
export const DEV_AUTH_BYPASSED =
  process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS_AUTH !== "false";

// Dev-only convenience: lets every page/route render as "signed in" with no
// Postgres DB or Discord OAuth app configured, by skipping
// next-auth/Prisma entirely rather than exercising the real Discord sign-in
// flow. Set DEV_BYPASS_AUTH=false to go through that real flow locally
// instead (needs DATABASE_URL/DISCORD_CLIENT_ID/DISCORD_CLIENT_SECRET set).
// Never honored when NODE_ENV=production, regardless of the env var.
const DEV_SESSION: Session = {
  user: {
    name: "Dev User",
    email: "dev@localhost",
    image: "https://cdn.discordapp.com/embed/avatars/0.png",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  discordId: "000000000000000000",
  userId: "dev-user",
  permissions: [STAFF_ADMIN_PERMISSION, DEVELOPER_PERMISSION],
  isStaff: true,
};

// Hosts where sign-in is skipped entirely and every visitor is treated as a
// site admin - requested for the fmrp.northbytetech.com deployment. Anyone
// who can open one of these hosts can do anything the admin panel can, so
// keep the list short. Set AUTH_BYPASS_HOSTS to a comma-separated list to
// change it, or to an empty string to turn the bypass off everywhere.
const AUTH_BYPASS_HOSTS = (process.env.AUTH_BYPASS_HOSTS ?? "fmrp.northbytetech.com")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter((host) => host.length > 0);

export const HOST_BYPASS_USER_ID = "host-bypass-guest";

// Uses the Host header itself, not X-Forwarded-Host, which a client could
// set to anything when the app sits behind a proxy that passes it through.
export function isAuthBypassHost(): boolean {
  if (AUTH_BYPASS_HOSTS.length === 0) {
    return false;
  }
  let host: string | null = null;
  try {
    host = headers().get("host");
  } catch {
    // headers() throws outside a request (e.g. at build time).
    return false;
  }
  const hostname = (host ?? "").toLowerCase().replace(/:\d+$/, "");
  return AUTH_BYPASS_HOSTS.includes(hostname);
}

// Admin, not developer: the Dev Dashboard shows infrastructure details
// (database host, OAuth client id) that a public guest doesn't need.
function hostBypassSession(): Session {
  return {
    user: { name: "Guest Admin", email: null, image: "https://cdn.discordapp.com/embed/avatars/1.png" },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    discordId: null,
    userId: HOST_BYPASS_USER_ID,
    permissions: [STAFF_ADMIN_PERMISSION],
    isStaff: true,
  };
}

export async function getSession(): Promise<Session | null> {
  if (DEV_AUTH_BYPASSED) {
    return DEV_SESSION;
  }
  if (isAuthBypassHost()) {
    return hostBypassSession();
  }
  return getServerSession(authOptions);
}
