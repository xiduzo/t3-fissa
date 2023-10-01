import { NextResponse } from "next/server";

export default async () => {
  return NextResponse.json({ message: "Hello, world!" });
};
