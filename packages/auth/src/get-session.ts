import { auth } from "./auth";

export const getSession = async (req: Request) => {
  const result = await auth.api.getSession({ headers: req.headers });
  if (!result) return null;

  return {
    expires: result.session.expiresAt.toISOString(),
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      image: result.user.image ?? null,
    },
  };
};
