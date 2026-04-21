import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "~/providers/ThemeProvider";
import { authClient } from "~/lib/auth-client";
import { api } from "~/utils/api";
import { Container } from "./Container";
import { FissaCode } from "./FissaCode";

export function JoinAFissa() {
  const { theme } = useTheme();
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const handleCreateFissa = () => {
    if (session?.user) {
      void navigate({ to: '/fissa/create' });
    } else {
      void authClient.signIn.social({
        provider: 'spotify',
        callbackURL: '/fissa/create',
      });
    }
  };
  const { data } = api.fissa.activeFissaCount.useQuery(undefined, {
    refetchInterval: 1000 * 60 * 5
  })

  const amount = useMemo(() => {
    if(data && data > 0) {
      return data
    }

    return Math.ceil(Math.random() * 3)
  }, [data])

  const prefix = useMemo(() => {
    if(amount === 1) {
      return 'is'
    }

    return 'are'
  }, [amount])

  const suffix = useMemo(() => {
    if(amount === 1) {
      return 'Fissa'
    }

    return 'Fissa\'s'
  }, [amount])

  return (
    <section
      id="join-a-fissa"
      aria-label="Join a fissa now!"
      className="py-20 sm:py-32"
      style={{backgroundColor: theme[900]}}
    >
      <Container>
        <div className="mx-auto max-w-2xl sm:text-center">
          <h2 className="text-3xl font-medium tracking-tight" style={{color: theme[100]}}>
            Create a Fissa
          </h2>
          <p className="mt-2 text-lg" style={{color: theme[100] + '90'}}>
            Start your own collaborative playlist
          </p>
          <button
            data-testid="create-fissa-btn"
            onClick={handleCreateFissa}
            className="mt-6 rounded-full px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: theme[500] }}
            type="button"
          >
            Create a Fissa
          </button>
        </div>
        <div className="mx-auto mt-12 flex max-w-2xl items-center gap-4 sm:text-center">
          <div className="h-px flex-1" style={{ backgroundColor: theme[100] + '30' }} />
          <span className="text-sm font-medium" style={{ color: theme[100] + '60' }}>or</span>
          <div className="h-px flex-1" style={{ backgroundColor: theme[100] + '30' }} />
        </div>
        <div className="mx-auto mt-12 max-w-2xl sm:text-center">
          <h2 className="text-3xl font-medium tracking-tight" style={{color: theme[100]}}>
            Join a Fissa
          </h2>
          <p className="mt-2 text-lg" style={{color: theme[100] + '90'}}>
            There {prefix} {amount} active {suffix}
          </p>
        </div>
        <FissaCode />
      </Container>
    </section>
  )
}
