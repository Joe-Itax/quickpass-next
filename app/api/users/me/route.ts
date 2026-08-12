import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * PATCH /api/users/me
 * Permet à l'utilisateur connecté de modifier son propre profil :
 * - name : son nom complet
 * - email : son adresse email
 * - currentPassword + newPassword + confirmPassword : pour changer le mot de passe
 */
export async function PATCH(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user || user instanceof NextResponse) return user;

  let body: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Corps de la requête invalide." },
      { status: 400 },
    );
  }

  const { name, email, currentPassword, newPassword, confirmPassword } = body;

  // Validation : au moins un champ doit être fourni
  const hasProfileUpdate = name !== undefined || email !== undefined;
  const hasPasswordUpdate =
    currentPassword !== undefined ||
    newPassword !== undefined ||
    confirmPassword !== undefined;

  if (!hasProfileUpdate && !hasPasswordUpdate) {
    return NextResponse.json(
      { message: "Aucune donnée à mettre à jour." },
      { status: 400 },
    );
  }

  // Validation du nom
  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return NextResponse.json(
      { message: "Le nom est invalide." },
      { status: 400 },
    );
  }

  // Validation de l'email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (email !== undefined && !emailRegex.test(email)) {
    return NextResponse.json(
      { message: "L'adresse email est invalide." },
      { status: 400 },
    );
  }

  // Validation du mot de passe
  if (hasPasswordUpdate) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          message:
            "Les 3 champs (ancien, nouveau et confirmation) sont requis pour changer le mot de passe.",
        },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "Le nouveau mot de passe et la confirmation ne correspondent pas." },
        { status: 400 },
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        {
          message:
            "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
        },
        { status: 400 },
      );
    }
  }

  try {
    // Vérifier l'ancien mot de passe si on veut le changer
    if (hasPasswordUpdate) {
      const result = await auth.api.signInEmail({
        body: {
          email: user.email,
          password: currentPassword!,
        },
      });

      if (!result) {
        return NextResponse.json(
          { message: "L'ancien mot de passe est incorrect." },
          { status: 400 },
        );
      }
    }

    // Vérifier si le nouvel email est déjà utilisé par un autre compte
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { message: "Cette adresse email est déjà utilisée par un autre compte." },
          { status: 409 },
        );
      }
    }

    // Mise à jour du profil (nom et/ou email)
    if (hasProfileUpdate) {
      const updateData: { name?: string; email?: string; searchableName?: string } = {};
      if (name) {
        updateData.name = name.trim();
        // Mettre à jour le nom recherchable (sans accents)
        updateData.searchableName = name
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      }
      if (email) updateData.email = email;

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Synchroniser avec Better Auth pour invalider/mettre à jour la session en cache
      try {
        await auth.api.updateUser({
          body: {
            ...(name ? { name: name.trim() } : {}),
            ...(email ? { email } : {}),
          },
          headers: req.headers,
        });
      } catch (e) {
        console.warn("Better Auth updateUser sync notice:", e);
      }
    }

    // Mise à jour du mot de passe via Better Auth
    if (hasPasswordUpdate) {
      await auth.api.changePassword({
        body: {
          currentPassword: currentPassword!,
          newPassword: newPassword!,
          revokeOtherSessions: false,
        },
        headers: req.headers,
      });
    }

    return NextResponse.json(
      { message: "Profil mis à jour avec succès." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur mise à jour profil:", error);

    if (error instanceof Error) {
      // Gérer les erreurs spécifiques de Better Auth
      if (
        error.message.includes("invalid password") ||
        error.message.includes("incorrect") ||
        error.message.toLowerCase().includes("mot de passe")
      ) {
        return NextResponse.json(
          { message: "L'ancien mot de passe est incorrect." },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { message: "Erreur serveur lors de la mise à jour du profil." },
      { status: 500 },
    );
  }
}
