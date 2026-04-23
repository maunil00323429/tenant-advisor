// Custom App — wraps every page in <ClerkProvider> so Clerk auth context
// (useUser, useAuth, <Protect>, etc.) is available throughout the app.

import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
