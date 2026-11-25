import { NextResponse } from "next/server";
import { getSiteSettings } from "@/content/repository";
import { getInquiryDb } from "@/server/db/client";

export async function GET() {
  const settings = getSiteSettings();
  try {
    const { sqlite } = getInquiryDb();
    sqlite.prepare("SELECT 1").get();
    return NextResponse.json(
      {
        status: "ok",
        intakeEnabled: settings.featureFlags.enableIntake,
        live3DEnabled: settings.featureFlags.enableLive3D,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        intakeEnabled: false,
      },
      { status: 503 }
    );
  }
}
