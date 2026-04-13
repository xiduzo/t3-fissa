import { createFileRoute } from "@tanstack/react-router";
import { Faqs } from "~/components/Faqs";
import { Hero } from "~/components/Hero";
import { JoinAFissa } from "~/components/JoinAFissa";
import { Layout } from "~/components/Layout";
import { PrimaryFeatures } from "~/components/PrimaryFeatures";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <Layout>
      <Hero />
      <PrimaryFeatures />
      <JoinAFissa />
      <Faqs />
    </Layout>
  );
}
