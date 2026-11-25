import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE_URL = process.env.AUDIT_URL || "http://localhost:3100";
const OUT_DIR =
  process.env.AUDIT_OUT ||
  "/Users/jayantolhyan/.gemini/antigravity/brain/2cd24464-c9c6-4ab4-84ca-58bb7804e6b7/scratch/audit-v2";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const results = {
    routes: [],
    overflows: [],
    consoleErrors: [],
    pageErrors: [],
    heroLive3DLoaded: false,
    approachOrbitRotated: false,
    scrollRewindRestored: false,
    hangarViewerLoaded: false,
    hangarSwitchedToDaylight: false,
    hangarSwitchedToBoarding: false,
    hangarSwitchedToFalcon: false,
    compareSliderWorked: false,
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

  const sitemapText = await (await fetch(`${BASE_URL}/sitemap.xml`)).text();
  results.sitemapExcludesDrafts =
    !sitemapText.includes("draft-template-example") && !sitemapText.includes("/case-studies");

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
  });

  try {
    // 2. Desktop 1440x900 full narrative & continuous 3D scroll test
    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await desktopCtx.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") results.consoleErrors.push(`[desktop] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      results.pageErrors.push(`[desktop] ${err.message}`);
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    // Wait for continuous hero model-viewer upgrade
    try {
      await page.waitForFunction(
        () => {
          const mv = document.querySelector("[data-chapter='arrival'] model-viewer");
          return Boolean(mv && mv.loaded);
        },
        { timeout: 15000 }
      );
      results.heroLive3DLoaded = true;
    } catch {
      results.heroLive3DLoaded = false;
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, "01-arrival-live3d-1440.png") });

    // Scroll into Approach beat (~900px down inside the 205svh track)
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(750);
    const approachOrbit = await page.evaluate(() => {
      const mv = document.querySelector("[data-chapter='arrival'] model-viewer");
      return mv ? String(mv.cameraOrbit || "") : "";
    });
    results.approachOrbitValue = approachOrbit;
    const approachTheta = Number.parseFloat(approachOrbit.split(" ")[0] || "NaN");
    results.approachOrbitRotated =
      Number.isFinite(approachTheta) && approachTheta > -18 && approachTheta <= 5;
    await page.screenshot({ path: path.join(OUT_DIR, "02-approach-scrubbed-1440.png") });

    // Scroll BACK UP to 0 to verify clean bidirectional rewind
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(550);
    const rewoundOrbit = await page.evaluate(() => {
      const mv = document.querySelector("[data-chapter='arrival'] model-viewer");
      return mv ? String(mv.cameraOrbit || "") : "";
    });
    results.rewoundOrbitValue = rewoundOrbit;
    results.scrollRewindRestored = rewoundOrbit.startsWith("-36");

    // Check 1280x800 hero above-the-fold fit (Hallmark Gate 44b)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    const heroMetrics = await page.evaluate(() => {
      const h1 = document.querySelector("h1")?.getBoundingClientRect();
      const cta = document.querySelector("[data-chapter='arrival'] a[href='#inquire']")?.getBoundingClientRect();
      const jet = document.querySelector("[data-plane='hero-jet']")?.getBoundingClientRect();
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
    await page.screenshot({ path: path.join(OUT_DIR, "03-hero-1280x800.png") });

    // Back to 1440x900 and inspect Chapter 4 Hangar (including Daylight lighting mode + Boarding + Falcon)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("#inspect-aircraft").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    try {
      await page.waitForFunction(
        () => {
          const mv = document.querySelector("#inspect-aircraft model-viewer");
          return Boolean(mv && mv.loaded);
        },
        { timeout: 15000 }
      );
      results.hangarViewerLoaded = true;
    } catch {
      results.hangarViewerLoaded = false;
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, "04-hangar-twilight-1440.png") });

    // Switch lighting to Daylight apron
    await page.getByRole("button", { name: "Daylight apron" }).click();
    await page.waitForTimeout(450);
    results.hangarSwitchedToDaylight = await page.evaluate(() =>
      Boolean(document.querySelector("#inspect-aircraft .jc-stage-daylight"))
    );
    await page.screenshot({ path: path.join(OUT_DIR, "04b-hangar-daylight-1440.png") });

    // Switch back to Twilight and test Boarding + Falcon
    await page.getByRole("button", { name: "Twilight hangar" }).click();
    await page.getByRole("button", { name: "Boarding", exact: true }).click();
    await page.waitForFunction(
      () => {
        const mv = document.querySelector("#inspect-aircraft model-viewer");
        return Boolean(mv && mv.src && mv.src.includes("boarding") && mv.loaded);
      },
      { timeout: 15000 }
    );
    results.hangarSwitchedToBoarding = true;

    await page.getByRole("tab", { name: "Falcon 2000" }).click();
    await page.waitForFunction(
      () => {
        const mv = document.querySelector("#inspect-aircraft model-viewer");
        return Boolean(mv && mv.src && mv.src.includes("falcon-2000") && mv.loaded);
      },
      { timeout: 15000 }
    );
    results.hangarSwitchedToFalcon = true;

    // Chapter 5: Ramp Comparison Slider (align top of comparison card cleanly under header)
    await page.evaluate(() => {
      const el = document.querySelector("[data-chapter='detail'] h3");
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 140;
        window.scrollTo(0, y);
      }
    });
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Boarding airstair" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Split view" }).click();
    await page.waitForTimeout(300);
    results.compareSliderWorked = await page.evaluate(() => {
      const slider = document.querySelector("[data-chapter='detail'] input[type='range']");
      return Boolean(slider && slider.value === "52");
    });
    await page.screenshot({ path: path.join(OUT_DIR, "05-detail-compare-slider-1440.png") });

    // Chapter 6: Synced Trust Editorial Split
    await page.evaluate(() => {
      const el = document.querySelector("[data-chapter='detail']")?.nextElementSibling;
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo(0, y);
      }
    });
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /Feasibility checked before quoting/i }).click();
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(OUT_DIR, "06-trust-split-1440.png") });

    // Check overflow across all required PRD breakpoints (320, 360, 390, 768, 1024, 1440, 1920)
    await page.evaluate(() => window.scrollTo(0, 0));
    for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(150);
      const ov = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      results.overflows.push({ width, ...ov, ok: ov.scrollWidth <= ov.clientWidth });
    }

    // Live E2E inquiry submission on /inquire
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/inquire?service=group-charter&ref=v2_audit`, {
      waitUntil: "networkidle",
    });
    await page.getByLabel(/Full name/i).fill("V2 Verification Arranger");
    await page.getByLabel(/Phone with country code/i).fill("+971 50 555 0199");
    await page.getByRole("checkbox", { name: /I agree that Jayant Charter/i }).click();
    await page.getByRole("button", { name: "Request a callback" }).click();
    await page.waitForSelector("text=Your inquiry has been received.", { timeout: 8000 });
    const refText = await page.locator("dd").first().textContent();
    results.e2eInquiryId = refText?.trim() || null;

    await desktopCtx.close();

    // 3. Mobile 390x844 verification
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
    await mPage.screenshot({ path: path.join(OUT_DIR, "07-mobile-390-hero.png") });
    await mPage.evaluate(() => {
      const stage = document.querySelector("#inspect-aircraft [data-surface='dark']");
      if (stage) {
        const y = stage.getBoundingClientRect().top + window.scrollY - 122;
        window.scrollTo(0, y);
      }
    });
    await mPage.waitForTimeout(450);
    results.mobilePosterFirstButtonVisible = await mPage
      .getByRole("button", { name: /Explore in 3D/i })
      .isVisible();
    await mPage.screenshot({ path: path.join(OUT_DIR, "08-mobile-390-hangar.png") });
    await mobileCtx.close();

    // 4. Reduced Motion verification
    const reducedCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const rPage = await reducedCtx.newPage();
    await rPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await rPage.waitForTimeout(400);
    await rPage.screenshot({ path: path.join(OUT_DIR, "09-reduced-motion-1440.png") });
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
    !results.heroLive3DLoaded ||
    !results.approachOrbitRotated ||
    !results.scrollRewindRestored ||
    !results.hangarViewerLoaded ||
    !results.hangarSwitchedToDaylight ||
    !results.hangarSwitchedToBoarding ||
    !results.hangarSwitchedToFalcon ||
    !results.compareSliderWorked ||
    !results.e2eInquiryId
  ) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
