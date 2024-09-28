import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useRef } from "react";
import { Button } from "~/components/Button";
import { Container } from "~/components/Container";

import { Layout } from "~/components/Layout";
import { toast } from "~/components/Toast";
import { useTheme } from "~/providers/ThemeProvider";
import { api } from "~/utils/api";

const JoinFissa: NextPage = () => {
  const { query } = useRouter();
  const { theme } = useTheme();
  console.log(theme)
  const shown = useRef(false);
  const router = useRouter();

  api.fissa.byId.useQuery(String(query.pin), {
    retry: false,
    enabled: !shown.current && !!String(query.pin),
    onSuccess: (data) => {
      shown.current = true;
      window.location.replace(`com.fissa://fissa/${data.pin}`);
    },
    onError: (error) => {
      toast.error({ message: error.message });
      // TODO: navigate to home page
      void router.replace("/");
    },
  });

  return (
    <>
      <Head>
        <title>Join the Fissa!</title>
        <meta name="description" content="Go become the DJ you have always dreamt to be." />
        <link rel="icon" href="/icon.png" />
      </Head>
      <Layout>
        <section
          id="get-free-shares-today"
          className="relative overflow-hidden py-48 sm:py-64"
          style={{ backgroundColor: theme[900] }}
        >
          <Container className="relative">
            <div className="mx-auto max-w-md sm:text-center">
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
                You have been invited to join Fissa {query.pin},
              </h2>
              <p className="mt-4 text-lg">
                become the DJ you have always dreamt to be.
              </p>
                <Button
                  className="mt-8"
                  style={{ backgroundColor: theme[500], color: theme[900] }}
                  onClick={() => {
                    window.location.replace(`com.fissa://fissa/${query.pin}`);
                  }}
                >
                Join Fissa {query.pin}
                </Button>
            </div>
          </Container>
        </section>
      </Layout>
    </>
  );
};

export default JoinFissa;
