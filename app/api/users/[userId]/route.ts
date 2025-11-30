import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { emailValid, passwordValid, validRoles } from "@/lib/constants";
import { removeAccents } from "@/lib/remove-accents";
// import { deleteFileFromVercelBlob } from "@/lib/middlewares/upload-file";

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
        { status: 404 }
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
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/:userId
 * Modifie un utilisateur (email, name, password, role) (Admin, Parent).
 */
// export async function PUT(req: NextRequest, context: UserContext) {
//   // Vérification du rôle avec ton middleware
//   // const roleCheckResult = await requireRole(["ADMIN", "PARENT"]);
//   // if (roleCheckResult) {
//   //   return roleCheckResult;
//   // }

//   const { userId } = await context.params;
//   const { ...rest } = await req.json();

//   // Champs autorisés
//   const allowedFields = ["email", "name", "password", "role", "isActive"];
//   const unknownFields = Object.keys(rest).filter(
//     (key) => !allowedFields.includes(key)
//   );

//   if (unknownFields.length > 0) {
//     return NextResponse.json(
//       { message: `Champs non autorisés: ${unknownFields.join(", ")}` },
//       { status: 400 }
//     );
//   }

//   // Validation du type des valeurs
//   const typeErrors = [];
//   if (rest.name !== undefined && typeof rest.name !== "string") {
//     typeErrors.push("Le nom doit être une chaîne de caractères");
//   }
//   if (rest.email !== undefined && typeof rest.email !== "string") {
//     typeErrors.push("L'email doit être une chaîne de caractères");
//   }
//   if (rest.password !== undefined && typeof rest.password !== "string") {
//     typeErrors.push("Le mot de passe doit être une chaîne de caractères");
//   }
//   if (rest.isActive !== undefined && typeof rest.isActive !== "boolean") {
//     typeErrors.push("isActive doit être un booléen");
//   }
//   if (rest.role !== undefined && typeof rest.role !== "string") {
//     typeErrors.push("Le rôle doit être une chaîne de caractères");
//   }

//   if (typeErrors.length > 0) {
//     return NextResponse.json(
//       { message: "Erreurs de validation", errors: typeErrors },
//       { status: 400 }
//     );
//   }

//   const dataToUpdate: Record<string, any> = {}; // Spécifier le type comme un objet avec des clés string et des valeurs any

//   for (const key of allowedFields) {
//     if (rest[key] !== undefined) {
//       switch (key) {
//         case "password":
//           if (!passwordValid.test(rest[key])) {
//             return NextResponse.json(
//               {
//                 message:
//                   "Mot de passe invalide. 8+ caractères, majuscule, minuscule, chiffre, symbole.",
//               },
//               { status: 400 }
//             );
//           }
//           // dataToUpdate.password = await hashValue(rest[key]);
//           break;

//         case "role":
//           if (!validRoles.includes(rest[key])) {
//             return NextResponse.json(
//               { message: "Rôle invalide." },
//               { status: 400 }
//             );
//           }
//           dataToUpdate.role = rest[key];
//           break;

//         case "name":
//           // Validation supplémentaire pour le nom
//           if (rest[key].trim().length === 0) {
//             return NextResponse.json(
//               { message: "Le nom ne peut pas être vide." },
//               { status: 400 }
//             );
//           }
//           dataToUpdate.name = rest[key].trim();
//           dataToUpdate.searchableName = removeAccents(rest[key].trim());
//           break;

//         case "isActive":
//           dataToUpdate.isActive = rest[key];
//           break;

//         case "email":
//           if (!emailValid.test(rest[key])) {
//             return NextResponse.json(
//               { message: "Email invalide." },
//               { status: 400 }
//             );
//           }
//           dataToUpdate.email = rest[key];
//           break;

//         default:
//           dataToUpdate[key] = rest[key];
//       }
//     }
//   }

//   if (Object.keys(dataToUpdate).length === 0) {
//     return NextResponse.json(
//       { message: "Aucun champ à mettre à jour." },
//       { status: 400 }
//     );
//   }

//   try {
//     const existingUser = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!existingUser) {
//       return NextResponse.json(
//         { message: "Utilisateur non trouvé." },
//         { status: 404 }
//       );
//     }

//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: dataToUpdate,
//       select: {
//         id: true,
//         email: true,
//         role: true,
//         name: true,
//         isActive: true,
//         updatedAt: true,
//       },
//     });

//     return NextResponse.json(
//       { message: "Utilisateur mis à jour avec succès.", user: updatedUser },
//       { status: 200 }
//     );
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   } catch (error: any) {
//     console.error("Erreur updateUser:", error);

//     if (error.code === "P2002" && error.meta?.target?.includes("email")) {
//       return NextResponse.json(
//         {
//           message: "Cet email est déjà utilisé par un autre utilisateur.",
//         },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       {
//         message: "Erreur serveur lors de la mise à jour de l'utilisateur.",
//       },
//       { status: 500 }
//     );
//   }
// }

// -------- DELETE: Supprimer un user --------
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
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
        { status: 404 }
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
      }
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
      { status: 200 }
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
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          error: error.message || "Erreur interne du serveur.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Une erreur inconnue est survenue lors de la suppression de l'utilisateur.",
      },
      { status: 500 }
    );
  }
}
