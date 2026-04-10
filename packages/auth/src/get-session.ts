import { db, sessions } from "@fissa/db";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "next-auth.session-token";
const SECURE_SESSION_COOKIE = "__Secure-next-auth.session-token";

export const getSession = async (req: Request) => {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k ?? "", v.join("=")];
    }),
  );

  const sessionToken = cookies[SECURE_SESSION_COOKIE] ?? cookies[SESSION_COOKIE];
  if (sessionToken) {
    const record = await db.query.sessions.findFirst({
      where: eq(sessions.sessionToken, sessionToken),
      columns: { expires: true },
      with: { user: true },
    });

    if (record && record.expires > new Date()) {
      return {
        expires: record.expires.toISOString(),
        user: {
          id: record.user.id,
          name: record.user.name,
          email: record.user.email ?? "",
          image: record.user.image,
        },
      };
    }
  }

  return expoHackServerSession(req);
};

const expoHackServerSession = async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const record = await db.query.sessions.findFirst({
    where: eq(sessions.sessionToken, authHeader),
    columns: { expires: true },
    with: { user: true },
  });

  if (!record) return null;

  return {
    expires: record.expires.toISOString(),
    user: {
      id: record.user.id,
      name: record.user.name,
      email: record.user.email ?? "",
      image: record.user.image,
    },
  };
};
