"use client";

import { useEffect, useState } from "react";
import DataStatusDisplay from "@/components/data-status-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import formatDateToCustom from "@/utils/format-date-to-custom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PencilIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import {
  useUpdateMyProfileMutation,
  UpdateMyProfilePayload,
} from "@/hooks/use-user";

// ─────────────────────────────────────────────
// Formulaire d'édition du profil
// ─────────────────────────────────────────────
interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentEmail: string;
  onSuccess?: () => Promise<unknown> | void;
}

function EditProfileDialog({
  open,
  onOpenChange,
  currentName,
  currentEmail,
  onSuccess,
}: EditProfileDialogProps) {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Affichage/masquage des mots de passe
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Synchroniser les champs lorsque le dialog s'ouvre ou que les données de la session changent
  useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(() => {
      setName(currentName);
      setEmail(currentEmail);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [open, currentName, currentEmail]);

  const { mutateAsync: updateProfile, isPending } =
    useUpdateMyProfileMutation();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!name.trim()) newErrors.name = "Le nom est requis.";
    if (!email.trim()) {
      newErrors.email = "L'email est requis.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "L'adresse email est invalide.";
    }

    // Validation mot de passe uniquement si l'un des champs est rempli
    const hasPasswordField = currentPassword || newPassword || confirmPassword;
    if (hasPasswordField) {
      if (!currentPassword)
        newErrors.currentPassword = "L'ancien mot de passe est requis.";
      if (!newPassword) {
        newErrors.newPassword = "Le nouveau mot de passe est requis.";
      } else if (!passwordRegex.test(newPassword)) {
        newErrors.newPassword =
          "8+ caractères, majuscule, minuscule, chiffre et caractère spécial requis.";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "La confirmation est requise.";
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: UpdateMyProfilePayload = {};

    if (name.trim() !== currentName) payload.name = name.trim();
    if (email !== currentEmail) payload.email = email;
    if (currentPassword && newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
      payload.confirmPassword = confirmPassword;
    }

    // Rien à changer
    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }

    try {
      await updateProfile(payload);
      if (onSuccess) {
        await onSuccess();
      }
      onOpenChange(false);
      // Réinitialiser les champs mot de passe
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch {
      // L'erreur est gérée par le hook via notification
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset à la fermeture
      setName(currentName);
      setEmail(currentEmail);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-black/80 border border-white/10 text-white/90 backdrop-blur-md">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <PencilIcon size={18} className="text-primary" />
            Modifier mon profil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* ─── Informations de base ─── */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Informations
            </p>
            <Separator className="bg-white/10" />
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-gray-300">
              Nom complet
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder="Votre nom complet"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary"
            />
            {errors.name && (
              <p className="text-red-400 text-xs">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email" className="text-gray-300">
              Adresse email
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: "" }));
              }}
              placeholder="votre@email.com"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary"
            />
            {errors.email && (
              <p className="text-red-400 text-xs">{errors.email}</p>
            )}
          </div>

          {/* ─── Mot de passe ─── */}
          <div className="space-y-1 pt-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Changer le mot de passe{" "}
              <span className="text-gray-500 normal-case font-normal">
                (optionnel)
              </span>
            </p>
            <Separator className="bg-white/10" />
          </div>

          {/* Ancien mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-gray-300">
              Ancien mot de passe
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword)
                    setErrors((p) => ({ ...p, currentPassword: "" }));
                }}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showCurrent ? "Masquer" : "Afficher"}
              >
                {showCurrent ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-400 text-xs">{errors.currentPassword}</p>
            )}
          </div>

          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-gray-300">
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword)
                    setErrors((p) => ({ ...p, newPassword: "" }));
                }}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showNew ? "Masquer" : "Afficher"}
              >
                {showNew ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-400 text-xs">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-gray-300">
              Confirmer le nouveau mot de passe
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors((p) => ({ ...p, confirmPassword: "" }));
                }}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showConfirm ? "Masquer" : "Afficher"}
              >
                {showConfirm ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-white/10 pt-4 gap-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="border-white/10 text-white/70 hover:bg-white/5"
              disabled={isPending}
            >
              Annuler
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="min-w-32"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2Icon size={16} className="animate-spin" />
                Enregistrement...
              </span>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const user = session?.user;

  if (isPending || error || !user) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  const avatarFallback = user.name
    .split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <div className="w-full mx-auto p-6 space-y-8">
      {/* Header Profile */}
      <div className="flex justify-center items-center gap-2">
        <h1 className="w-48 font-bold text-xl">Mon compte</h1>
        <div className="w-full h-0.5 bg-gray-500 rounded-4xl"></div>
      </div>

      {/* Carte avatar */}
      <div className="bg-black/30 text-white/90 border-none shadow-md shadow-black rounded-lg p-6 flex items-center space-x-6">
        <Avatar className="h-20 w-20 rounded-full bg-primary">
          <AvatarImage
            src={user.image || "/placeholder-avatar.png"}
            alt={user.name}
          />
          <AvatarFallback className="rounded-full text-xl bg-primary">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold text-primary">{user.name}</h2>
          <p className="text-muted/80 capitalize">{user.role}</p>
        </div>
      </div>

      {/* Informations de base */}
      <div className="bg-black/30 text-white/90 border-none shadow-md shadow-black rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Informations du compte</h3>
          {/* Bouton Modifier */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="flex items-center gap-2 border-white/10 text-white/80 hover:bg-white/5 hover:text-white transition-colors"
          >
            <PencilIcon size={14} />
            Modifier
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <InfoItem label="Nom complet" value={user.name} />
          <InfoItem label="Adresse email" value={user.email} />
          <InfoItem label="Rôle" value={user.role} />
          <InfoItem
            label="Date de création"
            value={formatDateToCustom(user.createdAt, false)}
          />
        </div>
      </div>

      {/* Dialog d'édition */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentName={user.name}
        currentEmail={user.email}
        onSuccess={async () => {
          await refetch();
        }}
      />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
