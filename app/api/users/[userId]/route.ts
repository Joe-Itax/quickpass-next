import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

interface UserContext {
  params: Promise<{
    userId: string;
  }>;
}

/**
 * GET /api/users/:userId
 * Récupère un utilisateur par ID (Admin, Parent).
 */
export async function GET(req: NextRequest, context: UserContext) {
  const admin = await requireAdmin(req);
  if (!admin || admin instanceof NextResponse) return admin;

  const { userId } = await context.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé." },
        { status: 404 },
      );
    }

    return NextResponse.json({ user });
  } catch (error: unknown) {
    console.error("Erreur getUserById:", error);
    return NextResponse.json(
      {
        message: "Erreur serveur.",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 },
    );
  }
}

// -------- DELETE: Supprimer un user --------
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const admin = await requireAdmin(req);
  if (!admin || admin instanceof NextResponse) return admin;

  const { userId } = await context.params;

  // --- Step 1: Fetch user and associated images (outside transaction) ---
  // We need this information regardless of the transaction outcome for potential image deletion.
  let userToDelete: {
    id: string;
    role: "ADMIN" | "USER";
    name: string;
    email: string;
    image?: string;
  };
  const imagesToDelete: string[] = [];

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        image: true,
      },
    });
    // if (!user) throw new Error("User not found");
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }
    userToDelete = {
      id: user.id,
      role: user.role,
      name: user.name || "",
      email: user.email,
      image: user.image || undefined,
    };
    // Check for protected accounts BEFORE any database changes or file deletions

    // Collect all image paths to delete
    if (userToDelete.image) {
      imagesToDelete.push(userToDelete.image);
    }

    // --- Step 2: Perform all database deletions within a transaction ---
    // This ensures database atomicity: all or nothing for DB operations.
    await prisma.$transaction(
      async (tx) => {
        // Finally, delete the user
        await tx.user.delete({
          where: { id: userId },
        });
      },
      {
        maxWait: 10000, // Temps max d'attente (10s)
        timeout: 10000, // Timeout de la transaction (10s)
      },
    );

    // --- Step 3: Delete images from Vercel Blob (after successful DB transaction) ---
    // if (imagesToDelete.length > 0) {
    //   const deletionPromises = imagesToDelete.map((imagePath) =>
    //     deleteFileFromVercelBlob(imagePath).catch((unlinkError) => {
    //       console.warn(
    //         `Impossible de supprimer l'image ${imagePath} de Vercel Blob:`,
    //         unlinkError
    //       );
    //       return null;
    //     })
    //   );
    //   await Promise.allSettled(deletionPromises);
    // }

    return NextResponse.json(
      {
        message:
          "L'utilisateur et toutes ses données associées ont été supprimés définitivement.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);

    if (error instanceof Error) {
      if (error.message === "Utilisateur non trouvé") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("Utilisateur protégé")) {
        return NextResponse.json({ message: error.message }, { status: 403 });
      }
      // Handle Prisma-specific errors like P2025 (record not found during deletion)
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: unknown }).code === "P2025"
      ) {
        return NextResponse.json(
          { message: "Article non trouvé ou n'a pas pu être mis à jour." }, // Or "User not found for deletion"
          { status: 404 },
        );
      }
      return NextResponse.json(
        {
          error: error.message || "Erreur interne du serveur.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Une erreur inconnue est survenue lors de la suppression de l'utilisateur.",
      },
      { status: 500 },
    );
  }
}
