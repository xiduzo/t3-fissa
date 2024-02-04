import { useRef } from "react";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import { Layout } from "~/components/Layout";
import { toast } from "~/components/Toast";
import { useTheme } from "~/providers/ThemeProvider";

const JoinFissa: NextPage = () => {
  const { query } = useRouter();
  const { theme } = useTheme();
  const shown = useRef(false);
  const router = useRouter();

  api.fissa.byId.useQuery(String(query.pin), {
    retry: false,
    enabled: !shown.current,
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
        <section className="mt-32 space-y-16 text-center">
          <h1 className="text-center text-3xl font-bold">Join the Fissa!</h1>
          <p>
            You have been invited to join Fissa{" "}
            <strong
              style={{
                color: theme["500"],
              }}
            >
              {query.pin}
            </strong>
            , become the DJ you have always dreamt to be.
          </p>
          <div className="flex flex-col items-center space-y-8">
            <a href="https://apps.apple.com/us/app/fissa-houseparty/id1632218985?itsct=apps_box_badge&itscg=30200">
              <Image
                className="p-3.5"
                width={192}
                height={108}
                src="https://apple-resources.s3.amazonaws.com/media-badges/download-on-the-app-store/black/en-us.svg"
                alt="Download on the App Store"
              />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.fissa&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1">
              <Image
                width={192}
                height={108}
                alt="Get it on Google Play"
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
              />
            </a>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default JoinFissa;
