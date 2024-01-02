import { useEffect } from "react";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";

const JoinFissa: NextPage = () => {
  const { query } = useRouter();

  useEffect(() => {
    if (!query.pin) return;

    window.location.replace(`com.fissa://fissa/${query.pin}`);
  }, [query.pin]);

  return (
    <>
      <Head>
        <title>Join the Fissa!</title>
        <meta name="description" content={`Join Fissa ${query.pin}`} />
        <link rel="icon" href="/icon.png" />
      </Head>
      <main className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-[#FF5FE5] to-[#FF5F72] p-12 text-[#150423]">
        <section className="space-y-16">
          <h1 className="text-center text-3xl font-bold">Join the Fissa!</h1>
          <p>
            You have been invited to join Fissa <strong>{query.pin}</strong>! Go become the DJ you
            have always dreamt to be!
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
      </main>
    </>
  );
};

export default JoinFissa;
