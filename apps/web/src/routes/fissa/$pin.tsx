import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { Button } from "~/components/Button";
import { Container } from "~/components/Container";
import { Layout } from "~/components/Layout";
import { toast } from "~/components/Toast";
import { useTheme } from "~/providers/ThemeProvider";
import { api } from "~/utils/api";

export const Route = createFileRoute("/fissa/$pin")({
  component: JoinFissa,
});

function JoinFissa() {
  const { pin } = Route.useParams();
  const { theme } = useTheme();
  const shown = useRef(false);
  const navigate = useNavigate();

  api.fissa.byId.useQuery(pin, {
    retry: false,
    enabled: !shown.current && !!pin,
    onSuccess: (data) => {
      shown.current = true;
      window.location.replace(`com.fissa://fissa/${data.pin}`);
    },
    onError: (error) => {
      toast.error({ message: error.message });
      void navigate({ to: "/" });
    },
  });

  return (
    <Layout>
      <section
        id="get-free-shares-today"
        className="relative overflow-hidden py-48 sm:py-64"
        style={{ backgroundColor: theme[900] }}
      >
        <Container className="relative">
          <div className="mx-auto max-w-md sm:text-center">
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
              You have been invited to join Fissa {pin},
            </h2>
            <p className="mt-4 text-lg">become the DJ you have always dreamt to be.</p>
            <Button
              className="mt-8"
              style={{ backgroundColor: theme[500], color: theme[900] }}
              onClick={() => {
                window.location.replace(`com.fissa://fissa/${pin}`);
              }}
            >
              Join Fissa {pin}
            </Button>
          </div>
        </Container>
      </section>
    </Layout>
  );
}
