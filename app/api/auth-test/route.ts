import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "Auth test endpoint working",
    env: {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    }
  })
}