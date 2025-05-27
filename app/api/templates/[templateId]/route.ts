import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  if (!templateId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "apicus-db-data");
  const doc = await db
    .collection("apicus-templates")
    .findOne({ templateId });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(doc);
} 