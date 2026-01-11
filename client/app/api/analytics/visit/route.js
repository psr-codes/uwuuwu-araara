import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

export async function POST(request) {
  try {
    const { page, userAgent, referrer } = await request.json();

    // Forward to backend for Prisma tracking
    const response = await fetch(`${BACKEND_URL}/api/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, userAgent, referrer }),
    });

    if (!response.ok) {
      console.error("[ANALYTICS] Backend visit tracking failed");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ANALYTICS] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
