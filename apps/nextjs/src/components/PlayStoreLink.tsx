import Image from "next/image";
import Link from 'next/link';

export function PlayStoreLink() {
  return (
    <Link
      href="https://play.google.com/store/apps/details?id=com.fissa&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1"
      aria-label="Get it on Google Play"
      className="flex items-center justify-center"
    >
      <Image
        aria-hidden="true"
        width={192}
        height={75}
        src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
        alt="Get it on Google Play"
      />
    </Link>
  )
}
