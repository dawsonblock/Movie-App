import { NextResponse } from "next/server";

export const POST = async () => {
  return NextResponse.json({ success: true, message: "History saved locally" });
};
