import { useMemo } from "react";
import { useTheme } from "~/providers/ThemeProvider";
import { api } from "~/utils/api";
import { Container } from "./Container";
import { FissaCode } from "./FissaCode";

export function JoinAFissa() {
  const { theme } = useTheme();
  const { data } = api.fissa.activeFissaCount.useQuery(undefined, {
    refetchInterval: 1000 * 60 * 5
  })

  const amount = useMemo(() => {
    if(data && data > 0) {
      return data * 4
    }

    return Math.floor(Math.random() * 3)
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
