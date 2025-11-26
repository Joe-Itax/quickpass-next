import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password = process.env.DEFAULT_PASSWORD,
      role = "USER",
    } = body;
    if (!name || !email || !password)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const newUser = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        role,
      },
    });
    return NextResponse.json({ user: newUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Une erreur est survenue à la récupération des utilisateurs" },
      { status: 400 }
    );
  }
}
