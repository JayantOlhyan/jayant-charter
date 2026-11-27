"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/content/schemas";

interface FaqBlockProps {
  items: FaqItem[];
  heading?: string;
  intro?: string;
}

export function FaqBlock({
  items,
  heading = "Before you ask.",
  intro = "Straight answers on custom itineraries, aircraft preferences, privacy, and how availability is confirmed.",
}: FaqBlockProps) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] lg:gap-16">
      <div>
        <h2 className="jc-display-section text-[var(--jc-ink)]">{heading}</h2>
        <p className="mt-4 max-w-[40ch] text-[17px] leading-relaxed text-[var(--jc-muted)]">
          {intro}
        </p>
      </div>

      <Accordion className="border-t border-[var(--jc-line-light)]">
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="border-b border-[var(--jc-line-light)]"
          >
            <AccordionTrigger className="py-4 font-serif text-[17.5px] leading-snug font-normal text-[var(--jc-ink)] hover:no-underline sm:py-5 sm:text-[20px] lg:text-[21px]">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-[15px] leading-relaxed text-[var(--jc-muted)]">
              <p className="m-0 max-w-[60ch]">{item.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
