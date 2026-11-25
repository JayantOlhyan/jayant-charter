import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCampaignBySlug,
  getPublishedAircraft,
  getPublishedCampaigns,
  getSiteSettings,
} from "@/content/repository";
import { ProgressiveInquiryForm } from "@/features/inquiry/ProgressiveInquiryForm";

interface CampaignPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPublishedCampaigns().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: CampaignPageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = getCampaignBySlug(slug);
  if (!campaign) return {};
  return {
    title: campaign.seo.title,
    description: campaign.seo.description,
    robots: campaign.seo.noIndex ? { index: false, follow: false } : undefined,
    alternates: { canonical: `/charter/${campaign.slug}` },
  };
}

export default async function CampaignLandingPage({ params }: CampaignPageProps) {
  const { slug } = await params;
  const campaign = getCampaignBySlug(slug);
  if (!campaign) notFound();

  const settings = getSiteSettings();
  const aircraftList = getPublishedAircraft();

  return (
    <section className="surface-stone py-16 md:py-24">
      <div className="jc-container grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <h1 className="jc-display-hero text-[var(--jc-ink)]">{campaign.headline}</h1>
          <p className="mt-5 text-[18px] leading-relaxed text-[var(--jc-muted)]">
            {campaign.lead}
          </p>
          <ul className="mt-7 space-y-3 border-t border-[var(--jc-line-light)] pt-6 text-[15px] text-[var(--jc-ink)]">
            {campaign.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <ProgressiveInquiryForm
          settings={settings}
          aircraftOptions={aircraftList}
          defaultService={campaign.inquiryServiceKey}
          defaultAircraftId={campaign.featuredAircraftId}
          entryPage={`/charter/${campaign.slug}`}
        />
      </div>
    </section>
  );
}
