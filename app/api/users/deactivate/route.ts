import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { removeAccents } from "@/lib/remove-accents";

const protectedAccounts = process.env.PROTECTED_ACCOUNTS?.split(",") || [];

interface ToggledUser {
  id: string;
  name: string | null;
  role: string;
  isActive: boolean;
  action: "réactivé" | "désactivé";
}

interface ProtectedUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin || admin instanceof NextResponse) return admin;

  const data = await req.json();
  const userIds = data.userIds;

  if (!Array.isArray(userIds)) {
    return NextResponse.json(
      {
        message: "Le corps de la requête doit contenir un tableau 'userIds'.",
      },
      { status: 400 },
    );
  }

  if (userIds.length === 0) {
    return NextResponse.json(
      {
        message: "Aucun identifiant d'utilisateur fourni.",
      },
      { status: 400 },
    );
  }

  // Validation des IDs
  const invalidIds = userIds.filter(
    (id: unknown) => typeof id !== "string" || !(id as string).trim(),
  );
  if (invalidIds.length > 0) {
    return NextResponse.json(
      {
        message: `IDs invalides: ${invalidIds.join(", ")}`,
      },
      { status: 400 },
    );
  }

  try {
    const toggledUsers: ToggledUser[] = [];
    const protectedUsers: ProtectedUser[] = [];

    // Pour gérer le cas "un seul ID introuvable" sans retourner dans la transaction
    let notFoundUserId: string | null = null;

    await prisma.$transaction(async (tx) => {
      // ----- Traitement d'un seul ID -----
      if (userIds.length === 1) {
        const user = await tx.user.findFirst({
          where: { id: userIds[0] as string },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

        if (!user) {
          notFoundUserId = userIds[0] as string;
          return; // sort de la transaction
        }

        // Vérifier si le compte est protégé
        const isProtected =
          protectedAccounts.some(
            (entry) => typeof entry === "string" && user.email === entry,
          ) ||
          protectedAccounts.some((protectedName) =>
            removeAccents(user.name ?? "")
              .toLowerCase()
              .includes(String(protectedName).toLowerCase()),
          );

        if (isProtected) {
          protectedUsers.push({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          });
          return;
        }

        // Toggle
        const newStatus = !user.isActive;
        await tx.user.update({
          where: { id: user.id },
          data: { isActive: newStatus },
        });

        toggledUsers.push({
          id: user.id,
          name: user.name,
          role: user.role,
          isActive: newStatus,
          action: newStatus ? "réactivé" : "désactivé",
        });

        return;
      }

      // ----- Traitement de plusieurs IDs à la fois -----
      for (const id of userIds as string[]) {
        const user = await tx.user.findFirst({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

        if (!user) continue;

        // Vérifier si le compte est protégé
        const isProtected =
          protectedAccounts.some(
            (entry) => typeof entry === "string" && user.email === entry,
          ) ||
          protectedAccounts.some((protectedName) =>
            removeAccents(user.name ?? "")
              .toLowerCase()
              .includes(String(protectedName).toLowerCase()),
          );

        if (isProtected) {
          protectedUsers.push({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          });
          continue;
        }

        // Toggle
        const newStatus = !user.isActive;
        await tx.user.update({
          where: { id },
          data: { isActive: newStatus },
        });

        toggledUsers.push({
          id: user.id,
          name: user.name,
          role: user.role,
          isActive: newStatus,
          action: newStatus ? "réactivé" : "désactivé",
        });
      }
    });

    // Cas d'un seul ID inexistant
    if (notFoundUserId) {
      return NextResponse.json(
        {
          message: `Aucun utilisateur trouvé avec l'identifiant : ${notFoundUserId}`,
        },
        { status: 400 },
      );
    }

    // Aucun utilisateur affecté (ni togglé, ni protégé trouvé)
    if (toggledUsers.length === 0 && protectedUsers.length === 0) {
      return NextResponse.json(
        {
          message: `Aucun utilisateur trouvé avec les identifiants fournis.`,
        },
        { status: 400 },
      );
    }

    // ----- Construction du message normalisé -----
    let responseMessage = "";

    if (toggledUsers.length > 0) {
      const desactivated = toggledUsers.filter((u) => u.action === "désactivé");
      const reactivated = toggledUsers.filter((u) => u.action === "réactivé");

      const parts: string[] = [];

      if (desactivated.length > 0) {
        const names = desactivated
          .map((u) => `${u.name ?? "Sans nom"} (${u.role})`)
          .join(", ");
        parts.push(
          `${desactivated.length} utilisateur${
            desactivated.length > 1 ? "s" : ""
          } désactivé${desactivated.length > 1 ? "s" : ""} : ${names}`,
        );
      }

      if (reactivated.length > 0) {
        const names = reactivated
          .map((u) => `${u.name ?? "Sans nom"} (${u.role})`)
          .join(", ");
        parts.push(
          `${reactivated.length} utilisateur${
            reactivated.length > 1 ? "s" : ""
          } réactivé${reactivated.length > 1 ? "s" : ""} : ${names}`,
        );
      }

      responseMessage = parts.join(". ");
    }

    if (protectedUsers.length > 0) {
      if (responseMessage) responseMessage += ". ";
      const count = protectedUsers.length;
      const names = protectedUsers
        .map((u) => `${u.name ?? "Sans nom"} (${u.email})`)
        .join(", ");
      responseMessage += `${count} compte${
        count > 1 ? "s" : ""
      } protégé${count > 1 ? "s" : ""} non modifié${
        count > 1 ? "s" : ""
      } : ${names}`;
    }

    console.log("Résultat de l'opération :", responseMessage);

    return NextResponse.json(
      {
        message: responseMessage,
        toggledUsers,
        protectedUsers: protectedUsers.length > 0 ? protectedUsers : undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour des utilisateurs.",
      },
      { status: 500 },
    );
  }
}
