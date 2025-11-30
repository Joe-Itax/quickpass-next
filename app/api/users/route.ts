import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { paginationQuery } from "@/lib/pagination";
import { emailValid, passwordValid, validRoles } from "@/lib/constants";
import { removeAccents } from "@/lib/remove-accents";

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const {
//       name,
//       email,
//       password = process.env.DEFAULT_PASSWORD,
//       role = "USER",
//     } = body;
//     if (!name || !email || !password)
//       return NextResponse.json({ error: "Missing fields" }, { status: 400 });

//     const newUser = await auth.api.signUpEmail({
//       body: {
//         email,
//         password,
//         name,
//         role,
//       },
//     });
//     return NextResponse.json({ user: newUser });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//   }
// }

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin || admin instanceof NextResponse) return admin;

  const {
    email,
    password = process.env.DEFAULT_PASSWORD_USER,
    role,
    name,
    ...extraFields
  } = await req.json();

  // Validation des champs
  if (Object.keys(extraFields).length > 0) {
    return NextResponse.json(
      { message: "Seuls 'email', 'password', 'role', 'name' sont autorisés." },
      { status: 400 }
    );
  }

  // Validation des valeurs
  if (!email || !role || !name) {
    return NextResponse.json(
      {
        message:
          "Tous les champs obligatoires (email, role & name) doivent être fournis.",
      },
      { status: 400 }
    );
  }

  // Validation des types
  const validationErrors = [];
  if (typeof name !== "string") validationErrors.push("Nom invalide");
  if (typeof email !== "string") validationErrors.push("Email invalide");
  if (typeof password !== "string")
    validationErrors.push("Mot de passe invalide");
  if (typeof role !== "string") validationErrors.push("Rôle invalide");

  if (validationErrors.length > 0) {
    return NextResponse.json(
      { message: "Erreurs de validation", errors: validationErrors },
      { status: 400 }
    );
  }

  if (!validRoles.includes(role)) {
    return NextResponse.json({ message: "Rôle invalide." }, { status: 400 });
  }

  if (!emailValid.test(email)) {
    return NextResponse.json({ message: "Email invalide." }, { status: 400 });
  }

  if (!passwordValid.test(password)) {
    return NextResponse.json(
      {
        message:
          "Mot de passe invalide. 8+ caractères, majuscule, minuscule, chiffre, symbole.",
      },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.$transaction(async (tx) => {
      // Vérification de l'unicité de l'email
      const existingUser = await tx.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        throw new Error("Un utilisateur actif avec cet email existe déjà.");
      }

      // Création de l'utilisateur
      const newUser = await auth.api.signUpEmail({
        body: {
          name: name.trim(),
          email,
          password,
          role,
          searchableName: removeAccents(name.trim()),
        },
      });

      return newUser;
    });

    // Préparation de la réponse
    const userResponse = {
      id: user.user.id,
      email: user.user.email,
      role: (user.user as { role?: string }).role,
      name: user.user.name,
      isActive: (user.user as { isActive?: boolean }).isActive,
      createdAt: user.user.createdAt,
      updatedAt: user.user.updatedAt,
    };

    return NextResponse.json(
      { message: "Utilisateur créé avec succès.", user: userResponse },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Erreur création utilisateur:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur serveur lors de la création.",
      },
      { status: 500 }
    );
  }
}

// export async function GET() {
//   try {
//     const users = await prisma.user.findMany({
//       orderBy: { createdAt: "desc" },
//     });
//     return NextResponse.json(users);
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json(
//       { error: "Une erreur est survenue à la récupération des utilisateurs" },
//       { status: 400 }
//     );
//   }
// }

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin || admin instanceof NextResponse) return admin;

  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    const result = await paginationQuery(prisma.user, page, limit, {
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

    return NextResponse.json({ message: "Liste des utilisateurs", ...result });
  } catch (error: unknown) {
    console.error("Erreur récupération utilisateurs:", error);
    return NextResponse.json(
      {
        message: "Erreur serveur.",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// -------------------------------------------------------------
// import { NextResponse, NextRequest } from "next/server";
// import { auth } from "@/lib/auth";
// import { requireAdmin } from "@/lib/auth-guards";
// import { emailValid, passwordValid, validRoles } from "@/lib/constants";
// import { paginationQuery } from "@/lib/pagination";
// import { prisma } from "@/lib/prisma";
// import { removeAccents } from "@/lib/remove-accents";

// /**
//  * GET /api/users
//  * Récupère tous les utilisateurs (Admin seulement).
//  */
// export async function GET(req: NextRequest) {
//   const admin = await requireAdmin(req);
//   if (!admin || admin instanceof NextResponse) return admin;

//   try {
//     const { searchParams } = new URL(req.url);
//     const page = Number(searchParams.get("page")) || 1;
//     const limit = Number(searchParams.get("limit")) || 10;

//     const result = await paginationQuery(prisma.user, page, limit, {
//       select: {
//         id: true,
//         email: true,
//         role: true,
//         name: true,
//         isActive: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     return NextResponse.json({ message: "Liste des utilisateurs", ...result });
//   } catch (error: unknown) {
//     console.error("Erreur récupération utilisateurs:", error);
//     return NextResponse.json(
//       {
//         message: "Erreur serveur.",
//         details:
//           process.env.NODE_ENV === "development"
//             ? error instanceof Error
//               ? error.message
//               : String(error)
//             : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * POST /api/users
//  * Crée un nouvel utilisateur (Admin seulement).
//  */
// export async function POST(req: NextRequest) {
//   const admin = await requireAdmin(req);
//   if (!admin || admin instanceof NextResponse) return admin;

//   const {
//     email,
//     password = process.env.DEFAULT_PASSWORD_USER,
//     role,
//     name,
//     ...extraFields
//   } = await req.json();

//   // Validation des champs
//   if (Object.keys(extraFields).length > 0) {
//     return NextResponse.json(
//       { message: "Seuls 'email', 'password', 'role', 'name' sont autorisés." },
//       { status: 400 }
//     );
//   }

//   // Validation des valeurs
//   if (!email || !role || !name) {
//     return NextResponse.json(
//       {
//         message:
//           "Tous les champs obligatoires (email, role & name) doivent être fournis.",
//       },
//       { status: 400 }
//     );
//   }

//   // Validation des types
//   const validationErrors = [];
//   if (typeof name !== "string") validationErrors.push("Nom invalide");
//   if (typeof email !== "string") validationErrors.push("Email invalide");
//   if (typeof password !== "string")
//     validationErrors.push("Mot de passe invalide");
//   if (typeof role !== "string") validationErrors.push("Rôle invalide");

//   if (validationErrors.length > 0) {
//     return NextResponse.json(
//       { message: "Erreurs de validation", errors: validationErrors },
//       { status: 400 }
//     );
//   }

//   if (!validRoles.includes(role)) {
//     return NextResponse.json({ message: "Rôle invalide." }, { status: 400 });
//   }

//   if (!emailValid.test(email)) {
//     return NextResponse.json({ message: "Email invalide." }, { status: 400 });
//   }

//   if (!passwordValid.test(password)) {
//     return NextResponse.json(
//       {
//         message:
//           "Mot de passe invalide. 8+ caractères, majuscule, minuscule, chiffre, symbole.",
//       },
//       { status: 400 }
//     );
//   }

//   try {
//     const user = await prisma.$transaction(async (tx) => {
//       // Vérification de l'unicité de l'email
//       const existingUser = await tx.user.findUnique({
//         where: {
//           email,
//         },
//       });

//       if (existingUser) {
//         throw new Error("Un utilisateur actif avec cet email existe déjà.");
//       }

//       // Création de l'utilisateur
//       const newUser = await auth.api.signUpEmail({
//         body: {
//           name: name.trim(),
//           email,
//           password,
//           role,
//           searchableName: removeAccents(name.trim()),
//         },
//       });

//       return newUser;
//     });

//     // Préparation de la réponse
//     const userResponse = {
//       id: user.user.id,
//       email: user.user.email,
//       role: (user.user as { role?: string }).role,
//       name: user.user.name,
//       isActive: (user.user as { isActive?: boolean }).isActive,
//       createdAt: user.user.createdAt,
//       updatedAt: user.user.updatedAt,
//     };

//     return NextResponse.json(
//       { message: "Utilisateur créé avec succès.", user: userResponse },
//       { status: 201 }
//     );
//   } catch (error: unknown) {
//     console.error("Erreur création utilisateur:", error);
//     return NextResponse.json(
//       {
//         message:
//           error instanceof Error
//             ? error.message
//             : "Erreur serveur lors de la création.",
//       },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * DELETE /api/users
//  * Supprime des utilisateurs (Soft Delete) (Admin seulement).
//  */
// export async function DELETE(req: NextRequest) {
//   const admin = await requireAdmin(req);
//   if (!admin || admin instanceof NextResponse) return admin;

//   const { userIds, ...extraFields } = await req.json();

//   // Validation des données
//   if (Object.keys(extraFields).length > 0) {
//     return NextResponse.json(
//       { message: "Seul 'userIds' est autorisé." },
//       { status: 400 }
//     );
//   }

//   if (!Array.isArray(userIds)) {
//     return NextResponse.json(
//       { message: "Le corps de la requête doit contenir un tableau 'userIds'." },
//       { status: 400 }
//     );
//   }

//   if (userIds.length === 0) {
//     return NextResponse.json(
//       { message: "Aucun identifiant d'utilisateur fourni." },
//       { status: 400 }
//     );
//   }

//   // Validation des IDs
//   const invalidIds = userIds.filter(
//     (id: string) => typeof id !== "string" || !id.trim()
//   );
//   if (invalidIds.length > 0) {
//     return NextResponse.json(
//       { message: `IDs invalides: ${invalidIds.join(", ")}` },
//       { status: 400 }
//     );
//   }

//   try {
//     const deactivatedUsers: {
//       id: string;
//       name: string | null;
//       role: string | null;
//     }[] = [];

//     await prisma.$transaction(async (tx) => {
//       for (const id of userIds) {
//         const user = await tx.user.findFirst({
//           where: {
//             id,
//             isActive: true, // S'assurer que l'utilisateur est actif
//           },
//         });

//         if (!user) continue; // Si l'utilisateur n'existe pas ou est déjà inactif, passer au suivant

//         // Désactiver l'utilisateur (soft delete)
//         await tx.user.update({
//           where: { id },
//           data: { isActive: false },
//         });

//         deactivatedUsers.push({
//           id: user.id,
//           name: user.name,
//           role: user.role,
//         });
//       }
//     });

//     if (deactivatedUsers.length === 0) {
//       return NextResponse.json(
//         {
//           message:
//             "Aucun utilisateur actif trouvé avec les identifiants fournis.",
//         },
//         { status: 404 }
//       );
//     }

//     const userCount = deactivatedUsers.length;

//     const userNames = deactivatedUsers
//       .map((u) => `${u.name} (${u.role})`)
//       .join(", ");

//     const message = `${userCount} utilisateur${
//       userCount > 1 ? "s" : ""
//     } désactivé${userCount > 1 ? "s" : ""}: ${userNames}`;

//     console.log("Soft delete effectué:", message);

//     return NextResponse.json(
//       {
//         message,
//         deactivatedUsers,
//       },
//       { status: 200 }
//     );
//   } catch (error: unknown) {
//     console.error("Erreur lors de la désactivation des utilisateurs:", error);
//     return NextResponse.json(
//       {
//         message: "Erreur serveur",
//         details:
//           process.env.NODE_ENV === "development"
//             ? error instanceof Error
//               ? error.message
//               : String(error)
//             : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }
