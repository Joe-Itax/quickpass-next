import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { paginationQuery } from "@/lib/pagination";
import { emailValid, passwordValid, validRoles } from "@/lib/constants";
import { removeAccents } from "@/lib/remove-accents";

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
