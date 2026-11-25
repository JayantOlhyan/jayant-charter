import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE_URL = process.env.AUDIT_URL || "http://localhost:3100";
const OUT_DIR =
  process.env.AUDIT_OUT ||
  "/Users/jayantolhyan/.gemini/antigravity/brain/2cd24464-c9c6-4ab4-84ca-58bb7804e6b7/scratch/audit";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const results = {
    routes: [],
    overflows: [],
    consoleErrors: [],
    pageErrors: [],
    viewerLoaded: false,
    viewerSwitchedToBoarding: false,
    viewerSwitchedToFalcon: false,
    heroAboveFold1280x800: false,
    e2eInquiryId: null,
  };

  // 1. HTTP route & status smoke checks
  const expected200 = [
    "/",
    "/services/private-jets",
    "/services/group-charter",
    "/services/helicopters",
    "/aircraft",
    "/aircraft/hawker-4000",
    "/aircraft/falcon-2000-classic",
    "/about",
    "/how-it-works",
    "/inquire",
    "/privacy",
    "/terms",
    "/sitemap.xml",
    "/robots.txt",
    "/api/health",
  ];
  const expected404 = [
    "/case-studies",
    "/case-studies/draft-template-example",
    "/insights",
    "/does-not-exist",
  ];

  for (const route of expected200) {
    const res = await fetch(`${BASE_URL}${route}`);
    results.routes.push({ route, status: res.status, expected: 200, ok: res.status === 200 });
  }
  for (const route of expected404) {
    const res = await fetch(`${BASE_URL}${route}`);
    results.routes.push({ route, status: res.status, expected: 404, ok: res.status === 404 });
  }

  // Verify sitemap excludes drafts & case-studies
  const sitemapText = await (await fetch(`${BASE_URL}/sitemap.xml`)).text();
  results.sitemapExcludesDrafts =
    !sitemapText.includes("draft-template-example") && !sitemapText.includes("/case-studies");

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
  });

  try {
    // 2. Desktop 1440x900 full narrative & live 3D test
    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await desktopCtx.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") results.consoleErrors.push(`[desktop] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      results.pageErrors.push(`[desktop] ${err.message}`);
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT_DIR, "01-hero-desktop-1440.png") });

    // Check 1280x800 hero above-the-fold fit (Hallmark Gate 44b)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    const heroMetrics = await page.evaluate(() => {
      const h1 = document.querySelector("h1")?.getBoundingClientRect();
      const cta = document.querySelector("[data-chapter='arrival'] a[href='#inquire']")?.getBoundingClientRect();
      const jet = document.querySelector("[data-plane='hero-jet'] img")?.getBoundingClientRect();
      return {
        h1Bottom: h1?.bottom ?? 9999,
        ctaBottom: cta?.bottom ?? 9999,
        jetTop: jet?.top ?? 9999,
        jetVisibleHeight: jet ? Math.min(jet.bottom, 800) - Math.max(jet.top, 0) : 0,
      };
    });
    results.heroMetrics1280x800 = heroMetrics;
    results.heroAboveFold1280x800 =
      heroMetrics.h1Bottom < 800 && heroMetrics.ctaBottom < 800 && heroMetrics.jetVisibleHeight > 180;
    await page.screenshot({ path: path.join(OUT_DIR, "02-hero-desktop-1280x800.png") });

    // Back to 1440x900 and capture key chapters
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("[data-chapter='approach']").scrollIntoViewIfNeeded();
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(OUT_DIR, "03-approach-desktop.png") });

    await page.locator("#services").scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUT_DIR, "04-services-desktop.png") });

    // Scroll to 3D Hangar and wait for live model-viewer Meshopt GLB load!
    await page.locator("#inspect-aircraft").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Wait up to 15s for model-viewer loaded=true
    try {
      await page.waitForFunction(
        () => {
          const mv = document.querySelector("model-viewer");
          return Boolean(mv && mv.loaded);
        },
        { timeout: 15000 }
      );
      results.viewerLoaded = true;
    } catch {
      results.viewerLoaded = false;
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT_DIR, "05-3d-hangar-live-desktop.png") });

    // Test configuration switching to Boarding (AC06)
    await page.getByRole("button", { name: "Boarding", exact: true }).click();
    await page.waitForFunction(
      () => {
        const mv = document.querySelector("model-viewer");
        return Boolean(mv && mv.src && mv.src.includes("boarding") && mv.loaded);
      },
      { timeout: 15000 }
    );
    results.viewerSwitchedToBoarding = true;
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, "05b-3d-hangar-boarding-desktop.png") });

    // Switch tab to Falcon 2000 Classic
    await page.getByRole("tab", { name: "Falcon 2000" }).click();
    await page.waitForFunction(
      () => {
        const mv = document.querySelector("model-viewer");
        return Boolean(mv && mv.src && mv.src.includes("falcon-2000") && mv.loaded);
      },
      { timeout: 15000 }
    );
    results.viewerSwitchedToFalcon = true;
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, "05c-3d-hangar-falcon-desktop.png") });

    // Detail macro chapter
    await page.locator("[data-chapter='detail']").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, "06-detail-macro-desktop.png") });

    // Inquiry chapter
    await page.locator("#inquire").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, "07-inquiry-desktop.png") });

    // Aircraft detail page (Falcon 2000 Classic)
    await page.goto(`${BASE_URL}/aircraft/falcon-2000-classic`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT_DIR, "08-aircraft-detail-falcon.png") });

    // Live E2E inquiry submission on /inquire?service=helicopter
    await page.goto(`${BASE_URL}/inquire?service=helicopter&ref=audit_ref_01`, {
      waitUntil: "networkidle",
    });
    await page.getByLabel(/Full name/i).fill("Audit Verification Guest");
    await page.getByLabel(/Phone with country code/i).fill("+971 50 456 7890");
    await page.getByRole("checkbox", { name: /I agree that Jayant Charter/i }).click();
    await page.getByRole("button", { name: "Request a callback" }).click();
    await page.waitForSelector("text=Your inquiry has been received.", { timeout: 8000 });
    const refText = await page.locator("dd").first().textContent();
    results.e2eInquiryId = refText?.trim() || null;
    await page.screenshot({ path: path.join(OUT_DIR, "09-inquire-success-desktop.png") });

    // Check overflow across all required PRD breakpoints (320, 360, 390, 768, 1024, 1440, 1920)
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(150);
      const ov = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      results.overflows.push({ width, ...ov, ok: ov.scrollWidth <= ov.clientWidth });
    }
    await desktopCtx.close();

    // 3. Mobile 390x844 (hasTouch + coarse pointer)
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const mPage = await mobileCtx.newPage();
    mPage.on("console", (msg) => {
      if (msg.type() === "error") results.consoleErrors.push(`[mobile] ${msg.text()}`);
    });
    await mPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await mPage.waitForTimeout(500);
    await mPage.screenshot({ path: path.join(OUT_DIR, "10-mobile-390-hero.png") });
    await mPage.locator("#inspect-aircraft").scrollIntoViewIfNeeded();
    await mPage.waitForTimeout(500);
    // On mobile, poster-first explicit button should appear rather than auto-downloading desktop GLB
    results.mobilePosterFirstButtonVisible = await mPage
      .getByRole("button", { name: /Explore in 3D/i })
      .isVisible();
    await mPage.screenshot({ path: path.join(OUT_DIR, "11-mobile-390-hangar.png") });
    await mobileCtx.close();

    // 4. Reduced Motion verification (AC07)
    const reducedCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const rPage = await reducedCtx.newPage();
    await rPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await rPage.waitForTimeout(400);
    await rPage.screenshot({ path: path.join(OUT_DIR, "12-reduced-motion-hero.png") });
    await reducedCtx.close();
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));

  const failedRoutes = results.routes.filter((r) => !r.ok);
  const failedOverflows = results.overflows.filter((o) => !o.ok);
  if (
    failedRoutes.length > 0 ||
    failedOverflows.length > 0 ||
    results.consoleErrors.length > 0 ||
    results.pageErrors.length > 0 ||
    !results.viewerLoaded ||
    !results.e2eInquiryId
  ) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
