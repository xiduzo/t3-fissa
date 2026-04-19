import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FC } from "react";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/fissa/create")({
  component: CreateFissaRoute,
});

function CreateFissaRoute() {
  return <CreateFissa />;
}

export const CreateFissa: FC = () => {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const handleSignIn = () => {
    void authClient.signIn.social({
      provider: "spotify",
      callbackURL: "/fissa/create",
    });
  };

  const handleBack = () => {
    void navigate({ to: "/" });
  };

  return (
    <div data-testid="create-fissa-page" className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold">Create a Fissa</h1>
      {session?.user ? (
        <p className="text-lg text-gray-600">
          You are signed in as <span className="font-semibold">{session.user.name}</span>. Track
          search and Fissa creation coming soon!
        </p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg text-gray-600">Sign in with Spotify to create a Fissa.</p>
          <button
            data-testid="create-fissa-signin-btn"
            onClick={handleSignIn}
            className="flex items-center justify-center gap-3 rounded-full px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: "#1DB954" }}
            type="button"
          >
            Sign in with Spotify
          </button>
        </div>
      )}
      <button
        data-testid="create-fissa-back-btn"
        onClick={handleBack}
        className="text-sm text-gray-500 underline"
        type="button"
      >
        Back to home
      </button>
    </div>
  );
};
