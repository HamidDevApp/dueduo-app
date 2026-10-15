"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkoutPath, utmLabelFromSearch } from "@/lib/attribution";

/**
 * Link to sign-up → checkout. Adds the UTM label from this page's own URL (after load),
 * so a sale can be matched to the ad or post. `from` is the guide name, when on a guide.
 */
export function CheckoutLink({
  from,
  className,
  children,
}: {
  from?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [href, setHref] = useState(() => checkoutPath({ from }));
  useEffect(() => {
    const utm = utmLabelFromSearch(window.location.search);
    if (utm) setHref(checkoutPath({ from, utm }));
  }, [from]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
