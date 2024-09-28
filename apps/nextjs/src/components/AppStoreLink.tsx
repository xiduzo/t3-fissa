import Image from "next/image";
import Link from 'next/link';

export function AppStoreLink() {
  return (
    <Link
      href="https://apps.apple.com/us/app/fissa-houseparty/id1632218985?itsct=apps_box_badge&itscg=30200"
      aria-label="Download on the App Store"
      className="flex items-center justify-center"
    >
      <Image
        width={192}
        height={108}
        src="https://apple-resources.s3.amazonaws.com/media-badges/download-on-the-app-store/black/en-us.svg"
        alt="Download on the App Store"
      />
    </Link>
  )
}
