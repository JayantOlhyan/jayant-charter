import type { Metadata, Viewport } from "next";
import { Archivo, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import {
  getMediaAsset,
  getPublishedAircraft,
  getPublicNavigationVisibility,
  getSiteSettings,
} from "@/content/repository";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SmoothScrollProvider } from "@/features/scroll/SmoothScrollProvider";
import { AttributionTracker } from "@/features/inquiry/attribution";
import { CallbackDrawerProvider } from "@/components/layout/CallbackDrawerProvider";
import { PageTransition } from "@/components/layout/PageTransition";

const archivo = Archivo({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  style: ["normal"],
  variable: "--font-archivo",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  variable: "--font-jakarta",
  display: "swap",
});

const settings = getSiteSettings();
const defaultOg = getMediaAsset(settings.defaultSeo.ogImageId);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: settings.defaultSeo.title,
    template: `%s | ${settings.brandName}`,
  },
  description: settings.defaultSeo.description,
  openGraph: {
    type: "website",
    siteName: settings.brandName,
    title: settings.defaultSeo.title,
    description: settings.defaultSeo.description,
    images: [
      {
        url: defaultOg.path,
        width: defaultOg.width,
        height: defaultOg.height,
        alt: defaultOg.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: settings.defaultSeo.title,
    description: settings.defaultSeo.description,
    images: [defaultOg.path],
  },
};

export const viewport: Viewport = {
  themeColor: "#312726",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navVisibility = getPublicNavigationVisibility();
  const aircraftList = getPublishedAircraft();

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.brandName,
    description: settings.descriptor,
    url: siteUrl,
  };

  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plusJakartaSans.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <a href="#main-content" className="jc-skip-link">
          Skip to main content
        </a>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />

        <Suspense fallback={null}>
          <AttributionTracker />
        </Suspense>

        <SmoothScrollProvider enabled={settings.featureFlags.enableSmoothScroll}>
          <CallbackDrawerProvider
            settings={settings}
            aircraftOptions={aircraftList}
          >
            <SiteHeader
              settings={settings}
              showCaseStudies={navVisibility.showCaseStudies}
              showInsights={navVisibility.showInsights}
            />
            <main id="main-content" className="flex flex-1 flex-col">
              <PageTransition>{children}</PageTransition>
            </main>
            <SiteFooter
              settings={settings}
              showCaseStudies={navVisibility.showCaseStudies}
              showInsights={navVisibility.showInsights}
            />
          </CallbackDrawerProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
