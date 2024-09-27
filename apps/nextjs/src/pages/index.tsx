import type { NextPage } from "next";
import Head from "next/head";
import { Faqs } from "~/components/Faqs";

import { Hero } from "~/components/Hero";
import { JoinAFissa } from "~/components/JoinAFissa";
import { Layout } from "~/components/Layout";
import { PrimaryFeatures } from "~/components/PrimaryFeatures";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Fissa</title>
        <meta name="description" content="A collaborative Spotify playlist" />
        <link rel="icon" href="/icon.png" />
      </Head>
      <Layout>
        <Hero />
        <PrimaryFeatures />
        <JoinAFissa />
        <Faqs />
      </Layout>
    </>
  );
};

export default Home;
