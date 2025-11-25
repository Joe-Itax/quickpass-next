"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const res = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/admin",
      });

      if (!res || res.error) {
        setError(
          res?.error?.code === "INVALID_EMAIL_OR_PASSWORD"
            ? "Email ou mot de passe incorrect"
            : "Impossible de se connecter"
        );
        setLoading(false);
        return;
      }

      // succès -> redirect to admin dashboard
      //   router.push("/admin");
    } catch (err) {
      console.error(err);
      setError("Erreur réseau");
      //   setError(err?.message ?? "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white/90">
            Bienvenu à l&apos;administration
          </CardTitle>
          <CardDescription className="text-white/80">
            Connectez-vous pour accéder au panneau d&apos;administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card" />
              <Field>
                <FieldLabel htmlFor="email" className="text-white/90">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  className="placeholder:text-white/60 text-white/80"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className="text-white/90">
                    Mot de passe
                  </FieldLabel>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="placeholder:text-white/60 text-white/80"
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
              </Field>
              {error && (
                <div className="text-sm text-red-400 mt-2">{error}</div>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-white/80">
        En cliquant sur &quot;Se connecter&quot;, vous acceptez les{" "}
        <Link href="" className="underline-offset-4 hover:underline">
          Conditions d&apos;utilisation
        </Link>{" "}
        et la{" "}
        <Link href="" className="underline-offset-4 hover:underline">
          Politique de confidentialité
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
