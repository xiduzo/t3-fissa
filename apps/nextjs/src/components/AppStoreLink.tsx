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
        aria-hidden="true"
        width={150}
        height={60}
        src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
        alt="Download on the App Store"
      />
    </Link>
  )
}
