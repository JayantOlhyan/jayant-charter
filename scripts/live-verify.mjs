import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE_URL = process.env.AUDIT_URL || "http://localhost:3105";
const OUT_DIR =
  process.env.AUDIT_OUT ||
  "/Users/jayantolhyan/.gemini/antigravity/brain/2cd24464-c9c6-4ab4-84ca-58bb7804e6b7/scratch/audit-jesko";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const results = {
    routes: [],
    overflows: [],
    consoleErrors: [],
    pageErrors: [],
    heroWindowRendered: false,
    heroAboveFold1280x800: false,
    planform3DLoaded: false,
    blueprintWipeReached: false,
    globeCanvasRendered: false,
    callbackDrawerOpened: false,
    aircraftShowroomLoaded: false,
    aircraftSwitchedDaylight: false,
    aircraftSwitchedBoarding: false,
    aircraftSwitchedFalcon: false,
    compareSliderWorked: false,
    mobilePosterFirstButtonVisible: false,
    e2eInquiryId: null,
  };

  // 1. Route HTTP status matrix
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
    "/api/visitor-time",
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
    const desktopCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "dark",
    });
    const page = await desktopCtx.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") results.consoleErrors.push(`[desktop] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      results.pageErrors.push(`[desktop] ${err.message}`);
    });

    // 2. Homepage Opening Photographic Cabin Window Hero
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500); // allow 0.85s altimeter preloader + 1.15s shade pull-up to settle completely
    results.heroWindowRendered = await page.evaluate(() => {
      const winImg = document.querySelector(
        "[data-plane='hero-window'] img[src*='jesko-cabin-window-photo']"
      );
      const shadeImg = document.querySelector(
        "[data-plane='hero-window'] img[src*='jesko-window-shade-photo']"
      );
      return Boolean(
        winImg &&
          winImg.complete &&
          winImg.naturalWidth > 0 &&
          shadeImg &&
          shadeImg.complete &&
          shadeImg.naturalWidth > 0
      );
    });
    await page.screenshot({ path: path.join(OUT_DIR, "01-opening-cabin-window-1440.png") });

    // Check 1280x800 above-the-fold fit
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(250);
    const heroMetrics = await page.evaluate(() => {
      const h1 = document.querySelector("h1")?.getBoundingClientRect();
      const pill = document.querySelector("button[aria-controls='jayant-callback-drawer']")?.getBoundingClientRect();
      return {
        h1Bottom: h1?.bottom ?? 9999,
        pillBottom: pill?.bottom ?? 9999,
      };
    });
    results.heroMetrics1280x800 = heroMetrics;
    results.heroAboveFold1280x800 = heroMetrics.h1Bottom < 800 && heroMetrics.pillBottom <= 800;

    // Back to 1440x900 & scroll through window into Cloud Philosophy
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      const el = document.getElementById("about");
      if (el) window.scrollTo(0, el.offsetTop + 60);
    });
    await page.waitForTimeout(650);
    await page.screenshot({ path: path.join(OUT_DIR, "02-cloud-philosophy-1440.png") });

    // Scroll into Planform Live 3D Overhead Hawker 4000
    await page.evaluate(() => {
      const el = document.getElementById("flight");
      if (el) window.scrollTo(0, el.offsetTop + 120);
    });
    try {
      await page.waitForFunction(
        () => {
          const mv = document.querySelector("#flight model-viewer");
          return Boolean(mv && mv.loaded);
        },
        { timeout: 15000 }
      );
      results.planform3DLoaded = true;
    } catch {
      results.planform3DLoaded = false;
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT_DIR, "03-planform-overhead-3d-1440.png") });

    // Scroll down to X-Ray Blueprint Wipe (near end of #flight track)
    await page.evaluate(() => {
      const el = document.getElementById("flight");
      if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight - window.innerHeight - 60);
    });
    await page.waitForTimeout(750);
    results.blueprintWipeReached = await page.evaluate(() => {
      const img = document.querySelector("#flight img[src*='hawker-blueprint-planform']");
      return Boolean(img);
    });
    await page.screenshot({ path: path.join(OUT_DIR, "04-planform-blueprint-wipe-1440.png") });

    // Scroll to Benefits / A Calmer Way to Fly Accordion + Live Dubai Clock
    await page.evaluate(() => {
      const el = document.getElementById("benefits");
      if (el) window.scrollTo(0, el.offsetTop - 40);
    });
    await page.waitForTimeout(550);
    await page.screenshot({ path: path.join(OUT_DIR, "05-trust-accordion-clock-1440.png") });

    // Scroll to Global 3D Globe.gl chapter
    await page.evaluate(() => {
      const el = document.getElementById("global");
      if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight - window.innerHeight);
    });
    try {
      await page.waitForFunction(
        () => Boolean(document.querySelector("#global canvas")),
        { timeout: 12000 }
      );
      results.globeCanvasRendered = true;
    } catch {
      results.globeCanvasRendered = false;
    }
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT_DIR, "06-global-globe-3d-1440.png") });

    // Test Slide-Up Callback Drawer via Floating Magnetic Pill
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.locator("button[aria-controls='jayant-callback-drawer']").click();
    await page.waitForSelector("#jayant-callback-drawer", { timeout: 5000 });
    await page.waitForTimeout(750);
    results.callbackDrawerOpened = await page.locator("#jayant-callback-drawer").isVisible();
    await page.screenshot({ path: path.join(OUT_DIR, "07-callback-drawer-open-1440.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);

    // 3. Dedicated Multi-Page /aircraft Digital Jets 3D Showroom + Ramp Comparison Slider
    await page.goto(`${BASE_URL}/aircraft`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      const el = document.getElementById("inspect-aircraft");
      if (el) window.scrollTo(0, el.offsetTop - 68);
    });
    try {
      await page.waitForFunction(
        () => {
          const mv = document.querySelector("#inspect-aircraft model-viewer");
          return Boolean(mv && mv.loaded);
        },
        { timeout: 15000 }
      );
      results.aircraftShowroomLoaded = true;
    } catch {
      results.aircraftShowroomLoaded = false;
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, "08-aircraft-showroom-1440.png") });

    await page.getByRole("button", { name: "Daylight apron" }).click();
    await page.waitForTimeout(400);
    results.aircraftSwitchedDaylight = await page.evaluate(() =>
      Boolean(document.querySelector("#inspect-aircraft .jc-stage-daylight"))
    );

    await page.getByRole("button", { name: "Twilight hangar" }).click();
    await page.getByRole("button", { name: "Boarding", exact: true }).click();
    await page.waitForFunction(
      () => {
        const mv = document.querySelector("#inspect-aircraft model-viewer");
        return Boolean(mv && mv.src && mv.src.includes("boarding") && mv.loaded);
      },
      { timeout: 15000 }
    );
    results.aircraftSwitchedBoarding = true;

    await page.getByRole("tab", { name: "Falcon 2000" }).click();
    await page.waitForFunction(
      () => {
        const mv = document.querySelector("#inspect-aircraft model-viewer");
        return Boolean(mv && mv.src && mv.src.includes("falcon-2000") && mv.loaded);
      },
      { timeout: 15000 }
    );
    results.aircraftSwitchedFalcon = true;

    // Ramp comparison slider on /aircraft
    await page.evaluate(() => {
      const el = document.querySelector("[data-chapter='detail']");
      if (el) window.scrollTo(0, el.offsetTop - 40);
    });
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Boarding airstair" }).click();
    await page.waitForTimeout(150);
    await page.getByRole("button", { name: "Split view" }).click();
    await page.waitForTimeout(250);
    results.compareSliderWorked = await page.evaluate(() => {
      const slider = document.querySelector("[data-chapter='detail'] input[type='range']");
      return Boolean(slider && slider.value === "52");
    });
    await page.screenshot({ path: path.join(OUT_DIR, "08b-aircraft-ramp-slider-1440.png") });

    // 4. Breakpoint zero-overflow sweep on /
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(140);
      const ov = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      results.overflows.push({ width, ...ov, ok: ov.scrollWidth <= ov.clientWidth });
    }

    // 5. E2E inquiry persistence on /inquire (also capture standalone /inquire card layout)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/inquire?service=group-charter&ref=jesko_audit`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, "13-inquire-page-1440.png") });
    await page.getByLabel(/Full name/i).fill("Jesko Rebuild Verification");
    await page.getByLabel(/Phone with country code/i).fill("+971 50 555 0144");
    await page.getByRole("checkbox", { name: /I agree that Jayant Charter/i }).click();
    await page.locator("#main-content").getByRole("button", { name: "Request a callback" }).click();
    await page.waitForSelector("text=Your inquiry has been received.", { timeout: 8000 });
    const refText = await page.locator("dd").first().textContent();
    results.e2eInquiryId = refText?.trim() || null;

    // Capture Awwwards-inspired animated 404 flight page on a dedicated page so expected HTTP 404 doesn't pollute app consoleErrors
    const notFoundPage = await desktopCtx.newPage();
    await notFoundPage.goto(`${BASE_URL}/does-not-exist`, { waitUntil: "networkidle" });
    await notFoundPage.waitForTimeout(1200);
    await notFoundPage.screenshot({ path: path.join(OUT_DIR, "12-not-found-404-1440.png") });
    await notFoundPage.close();

    await desktopCtx.close();

    // 6. Mobile 390x844 captures
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
    await mPage.waitForTimeout(2500);
    await mPage.screenshot({ path: path.join(OUT_DIR, "09-mobile-390-hero.png") });

    await mPage.goto(`${BASE_URL}/aircraft`, { waitUntil: "networkidle" });
    await mPage.evaluate(() => {
      const el = document.getElementById("inspect-aircraft");
      if (el) window.scrollTo(0, el.offsetTop - 68);
    });
    await mPage.waitForTimeout(450);
    results.mobilePosterFirstButtonVisible = await mPage
      .getByRole("button", { name: /Explore in 3D/i })
      .isVisible();
    await mPage.screenshot({ path: path.join(OUT_DIR, "10-mobile-390-aircraft.png") });
    await mobileCtx.close();

    // 7. Reduced motion check
    const reducedCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const rPage = await reducedCtx.newPage();
    await rPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await rPage.waitForTimeout(400);
    await rPage.screenshot({ path: path.join(OUT_DIR, "11-reduced-motion-1440.png") });
    await reducedCtx.close();
  } finally {
    await browser.close();
    console.log(JSON.stringify(results, null, 2));
  }

  const failedRoutes = results.routes.filter((r) => !r.ok);
  const failedOverflows = results.overflows.filter((o) => !o.ok);
  if (
    failedRoutes.length > 0 ||
    failedOverflows.length > 0 ||
    results.consoleErrors.length > 0 ||
    results.pageErrors.length > 0 ||
    !results.heroWindowRendered ||
    !results.heroAboveFold1280x800 ||
    !results.planform3DLoaded ||
    !results.blueprintWipeReached ||
    !results.globeCanvasRendered ||
    !results.callbackDrawerOpened ||
    !results.aircraftShowroomLoaded ||
    !results.aircraftSwitchedDaylight ||
    !results.aircraftSwitchedBoarding ||
    !results.aircraftSwitchedFalcon ||
    !results.compareSliderWorked ||
    !results.mobilePosterFirstButtonVisible ||
    !results.e2eInquiryId
  ) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
