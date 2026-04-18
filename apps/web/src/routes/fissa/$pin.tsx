import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FC } from "react";
import { Layout } from "~/components/Layout";
import { toast } from "~/components/Toast";
import { api } from "~/utils/api";

export const Route = createFileRoute("/fissa/$pin")({
  component: JoinFissa,
});

interface QueuePageProps {
  pin: string;
}

export const QueuePage: FC<QueuePageProps> = ({ pin }) => {
  const navigate = useNavigate();

  api.fissa.byId.useQuery(pin, {
    retry: false,
    enabled: !!pin,
    onError: (error) => {
      toast.error({ message: error.message });
      void navigate({ to: "/" });
    },
  });

  return (
    <Layout>
      <div className="flex min-h-screen flex-col">
        {/* Header: Fissa PIN */}
        <header className="px-4 py-6 text-center">
          <h1 className="text-2xl font-bold tracking-widest">{pin}</h1>
        </header>

        {/* Currently-playing track slot */}
        <section data-testid="queue-now-playing" className="px-4 py-4">
          {/* Placeholder — live track data wired in a later task */}
        </section>

        {/* Upcoming tracks list slot */}
        <section data-testid="queue-upcoming" className="flex-1 px-4 py-4">
          {/* Placeholder — upcoming tracks list wired in a later task */}
        </section>

        {/* Unauthenticated sign-in CTA slot */}
        <section data-testid="queue-signin-cta" className="px-4 py-6">
          {/* Placeholder — sign-in CTA wired in a later task */}
        </section>
      </div>
    </Layout>
  );
};

function JoinFissa() {
  const { pin } = Route.useParams();
  return <QueuePage pin={pin} />;
}
