import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { paginationQuery } from "@/lib/pagination";
import { removeAccents } from "@/lib/remove-accents";

/**
 * GET /api/users/search
 * Rechercher un utilisateur par email ou nom (Admin seulement).
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin || admin instanceof NextResponse) return admin;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { message: "Veuillez fournir une requête de recherche." },
        { status: 400 }
      );
    }

    const cleanedQuery = query.trim();
    if (cleanedQuery.length < 1) {
      return NextResponse.json(
        { message: "La requête doit contenir au moins 1 caractère." },
        { status: 400 }
      );
    }

    const result = await paginationQuery(prisma.user, page, limit, {
      where: {
        OR: [
          {
            searchableName: {
              contains: removeAccents(cleanedQuery),
              mode: "insensitive",
            },
          },
          { email: { contains: cleanedQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      { message: "Résultats de la recherche", ...result },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur lors de la recherche des utilisateurs :", error);
    return NextResponse.json(
      {
        message: "Erreur lors de la recherche.",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
