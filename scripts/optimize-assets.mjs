import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE_ROOT = "/Users/jayantolhyan/Documents/ChatGPT/Private jets";
const BRAIN_DIR =
  "/Users/jayantolhyan/.gemini/antigravity/brain/2cd24464-c9c6-4ab4-84ca-58bb7804e6b7";

const PUBLIC_MEDIA = path.join(ROOT, "public", "media", "v1");
const PUBLIC_MODELS = path.join(ROOT, "public", "models", "v1");
const PUBLIC_VENDOR = path.join(ROOT, "public", "vendor");

fs.mkdirSync(PUBLIC_MEDIA, { recursive: true });
fs.mkdirSync(PUBLIC_MODELS, { recursive: true });
fs.mkdirSync(PUBLIC_VENDOR, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  media: [],
  models: [],
};

async function processImage(src, destName, options = {}) {
  const dest = path.join(PUBLIC_MEDIA, destName);
  const pipeline = sharp(src);
  if (options.width || options.height) {
    pipeline.resize(options.width ?? null, options.height ?? null, {
      fit: options.fit ?? "inside",
      withoutEnlargement: true,
    });
  }
  if (destName.endsWith(".webp")) {
    await pipeline.webp({ quality: options.quality ?? 86, alphaQuality: 95 }).toFile(dest);
  } else if (destName.endsWith(".jpg")) {
    await pipeline.jpeg({ quality: options.quality ?? 88, mozjpeg: true }).toFile(dest);
  } else {
    await pipeline.toFile(dest);
  }
  const meta = await sharp(dest).metadata();
  const stat = fs.statSync(dest);
  report.media.push({
    file: `/media/v1/${destName}`,
    width: meta.width,
    height: meta.height,
    bytes: stat.size,
    kb: Math.round((stat.size / 1024) * 10) / 10,
  });
  return { width: meta.width, height: meta.height, bytes: stat.size };
}

async function generateOgImage() {
  const skySrc = path.join(BRAIN_DIR, "high_altitude_twilight_sky_plate_1795582829085.jpg");
  const jetSrc = path.join(SOURCE_ROOT, "models/hawker-4000-realistic/hawker-4000-hero.png");
  const dest = path.join(PUBLIC_MEDIA, "og-default.jpg");

  const jetResized = await sharp(jetSrc)
    .resize(980, null, { fit: "inside" })
    .toBuffer();

  const overlaySvg = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0A1D1C" stop-opacity="0.58"/>
          <stop offset="65%" stop-color="#102B2A" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#0A1D1C" stop-opacity="0.72"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <text x="64" y="92" font-family="Georgia, serif" font-size="34" fill="#F7F5ED">Jayant <tspan fill="#E8C184">Charter</tspan></text>
      <text x="64" y="566" font-family="Georgia, serif" font-size="42" fill="#F7F5ED">Private charter for your itinerary.</text>
    </svg>
  `);

  await sharp(skySrc)
    .resize(1200, 630, { fit: "cover", position: "center" })
    .composite([
      { input: overlaySvg, top: 0, left: 0 },
      { input: jetResized, top: 130, left: 170 },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(dest);

  const stat = fs.statSync(dest);
  report.media.push({
    file: "/media/v1/og-default.jpg",
    width: 1200,
    height: 630,
    bytes: stat.size,
    kb: Math.round((stat.size / 1024) * 10) / 10,
  });
}

async function main() {
  console.log("1. Processing high-res aircraft renders and editorial plates...");

  // Bespoke generated plates
  await processImage(
    path.join(BRAIN_DIR, "high_altitude_twilight_sky_plate_1795582829085.jpg"),
    "hero-sky-plate.webp",
    { width: 1920, quality: 84 }
  );
  await processImage(
    path.join(BRAIN_DIR, "udaipur_executive_helicopter_dusk_1795582853151.jpg"),
    "helicopter-arrival.webp",
    { width: 1600, quality: 85 }
  );
  await processImage(
    path.join(BRAIN_DIR, "corporate_group_charter_twilight_clean_1795582906611.jpg"),
    "group-charter-apron.webp",
    { width: 1600, quality: 85 }
  );

  // Hawker 4000 realistic transparent renders (from PNG masters for maximum sharpness)
  const hawkerDir = path.join(SOURCE_ROOT, "models/hawker-4000-realistic");
  const hawkerImages = [
    ["hawker-4000-hero.png", "hawker-4000-hero.webp", 1920],
    ["hawker-4000-low-angle.png", "hawker-4000-low-angle.webp", 1400],
    ["hawker-4000-parked.png", "hawker-4000-parked.webp", 1400],
    ["hawker-4000-boarding.png", "hawker-4000-boarding.webp", 1400],
    ["hawker-4000-engine-detail.png", "hawker-4000-engine-detail.webp", 1400],
    ["hawker-4000-entry-detail.png", "hawker-4000-entry-detail.webp", 1400],
    ["hawker-4000-gear-detail.png", "hawker-4000-gear-detail.webp", 1400],
  ];
  for (const [src, dst, width] of hawkerImages) {
    await processImage(path.join(hawkerDir, src), dst, { width, quality: 88 });
  }

  // Falcon 2000 Classic transparent renders
  const falconDir = path.join(SOURCE_ROOT, "models/falcon-2000");
  const falconImages = [
    ["falcon-2000-hero.png", "falcon-2000-hero.webp", 1920],
    ["falcon-2000-parked.png", "falcon-2000-parked.webp", 1400],
    ["falcon-2000-engine-detail.png", "falcon-2000-engine-detail.webp", 1400],
  ];
  for (const [src, dst, width] of falconImages) {
    await processImage(path.join(falconDir, src), dst, { width, quality: 88 });
  }

  // Static OG social image
  await generateOgImage();

  // Copy pinned local model-viewer runtime & Apache-2.0 license
  console.log("2. Copying pinned model-viewer 4.1.0 runtime and studio environment...");
  fs.copyFileSync(
    path.join(hawkerDir, "model-viewer.min.js"),
    path.join(PUBLIC_VENDOR, "model-viewer.min.js")
  );
  fs.copyFileSync(
    path.join(hawkerDir, "MODEL-VIEWER-LICENSE.txt"),
    path.join(PUBLIC_VENDOR, "MODEL-VIEWER-LICENSE.txt")
  );
  fs.copyFileSync(
    path.join(hawkerDir, "studio.hdr"),
    path.join(PUBLIC_MODELS, "studio-env.hdr")
  );

  // Optimize GLB tiers via @gltf-transform/cli (meshopt + dedup + prune + texture sizing)
  console.log("3. Optimizing 5 GLB configurations into desktop & mobile tiers...");
  const glbJobs = [
    {
      id: "hawker-flight",
      src: path.join(hawkerDir, "hawker-4000.glb"),
      desktop: "hawker-4000-flight-desktop.glb",
      mobile: "hawker-4000-flight-mobile.glb",
    },
    {
      id: "hawker-parked",
      src: path.join(hawkerDir, "hawker-4000-parked.glb"),
      desktop: "hawker-4000-parked-desktop.glb",
      mobile: "hawker-4000-parked-mobile.glb",
    },
    {
      id: "hawker-boarding",
      src: path.join(hawkerDir, "hawker-4000-boarding.glb"),
      desktop: "hawker-4000-boarding-desktop.glb",
      mobile: "hawker-4000-boarding-mobile.glb",
    },
    {
      id: "falcon-flight",
      src: path.join(falconDir, "falcon-2000.glb"),
      desktop: "falcon-2000-flight-desktop.glb",
      mobile: "falcon-2000-flight-mobile.glb",
    },
    {
      id: "falcon-parked",
      src: path.join(falconDir, "falcon-2000-parked.glb"),
      desktop: "falcon-2000-parked-desktop.glb",
      mobile: "falcon-2000-parked-mobile.glb",
    },
  ];

  for (const job of glbJobs) {
    const rawBytes = fs.statSync(job.src).size;
    const desktopOut = path.join(PUBLIC_MODELS, job.desktop);
    const mobileOut = path.join(PUBLIC_MODELS, job.mobile);

    try {
      // Desktop tier: zero geometry loss (--simplify false) to keep 3D lettering/hardware razor-sharp + meshopt + 1024px webp
      execFileSync(
        "npx",
        [
          "--yes",
          "@gltf-transform/cli",
          "optimize",
          job.src,
          desktopOut,
          "--compress",
          "meshopt",
          "--instance",
          "false",
          "--simplify",
          "false",
          "--texture-compress",
          "webp",
          "--texture-size",
          "1024",
        ],
        { stdio: "inherit" }
      );

      // Mobile tier: gentle simplification preserving silhouette & lettering + 512px webp textures + meshopt (target <= 3MB)
      execFileSync(
        "npx",
        [
          "--yes",
          "@gltf-transform/cli",
          "optimize",
          job.src,
          mobileOut,
          "--compress",
          "meshopt",
          "--instance",
          "false",
          "--simplify",
          "true",
          "--simplify-ratio",
          "0.8",
          "--simplify-error",
          "0.0004",
          "--texture-compress",
          "webp",
          "--texture-size",
          "512",
        ],
        { stdio: "inherit" }
      );
    } catch (err) {
      console.warn(`gltf-transform fallback for ${job.id}: ${err.message}`);
      fs.copyFileSync(job.src, desktopOut);
      fs.copyFileSync(job.src, mobileOut);
    }

    const desktopBytes = fs.statSync(desktopOut).size;
    const mobileBytes = fs.statSync(mobileOut).size;
    report.models.push({
      id: job.id,
      rawBytes,
      rawMiB: Number((rawBytes / 1048576).toFixed(2)),
      desktopFile: `/models/v1/${job.desktop}`,
      desktopBytes,
      desktopMiB: Number((desktopBytes / 1048576).toFixed(2)),
      mobileFile: `/models/v1/${job.mobile}`,
      mobileBytes,
      mobileMiB: Number((mobileBytes / 1048576).toFixed(2)),
    });
  }

  // Update content/media.json & content/aircraft.json with exact measured widths/heights/bytes
  const mediaJsonPath = path.join(ROOT, "content", "media.json");
  const mediaRecords = JSON.parse(fs.readFileSync(mediaJsonPath, "utf8"));
  const mediaMap = new Map(report.media.map((m) => [m.file, m]));
  for (const rec of mediaRecords) {
    const measured = mediaMap.get(rec.path);
    if (measured) {
      rec.width = measured.width;
      rec.height = measured.height;
    }
  }
  fs.writeFileSync(mediaJsonPath, JSON.stringify(mediaRecords, null, 2) + "\n");

  const aircraftJsonPath = path.join(ROOT, "content", "aircraft.json");
  const aircraftRecords = JSON.parse(fs.readFileSync(aircraftJsonPath, "utf8"));
  const modelMap = new Map(report.models.map((m) => [m.desktopFile, m]));
  for (const ac of aircraftRecords) {
    for (const cfg of ac.configurations) {
      const measured = modelMap.get(cfg.desktopUrl);
      if (measured) {
        cfg.desktopBytes = measured.desktopBytes;
        cfg.mobileBytes = measured.mobileBytes;
      }
    }
  }
  fs.writeFileSync(aircraftJsonPath, JSON.stringify(aircraftRecords, null, 2) + "\n");

  fs.writeFileSync(
    path.join(PUBLIC_MODELS, "manifest.json"),
    JSON.stringify(report, null, 2) + "\n"
  );

  console.log("\nAsset optimization complete:");
  console.table(
    report.models.map((m) => ({
      Model: m.id,
      RawMiB: m.rawMiB,
      DesktopMiB: m.desktopMiB,
      MobileMiB: m.mobileMiB,
    }))
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
