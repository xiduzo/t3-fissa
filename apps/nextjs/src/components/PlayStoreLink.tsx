import Image from "next/image";
import Link from 'next/link';

export function PlayStoreLink() {
  return (
    <Link
      href="https://apps.apple.com/us/app/fissa-houseparty/id1632218985?itsct=apps_box_badge&itscg=30200"
      aria-label="Download on the App Store"
      className="flex items-center justify-center"
    >
      <Image
        width={192}
        height={108}
        src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
        alt="Get it on Google Play"
      />
    </Link>
  )
}
