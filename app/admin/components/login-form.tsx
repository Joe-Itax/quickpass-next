"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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
            ? "Identifiants de sécurité incorrects"
            : "Échec de l'authentification système",
        );
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error(err);
      setError("Signal réseau interrompu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-8 w-full max-w-md mx-auto", className)}
      {...props}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 rounded-[2.5rem] bg-white/2 border border-white/10 backdrop-blur-2xl shadow-2xl"
      >
        {/* Décoration Néon */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#FDB623]" />

        <div className="flex flex-col items-center mb-8">
          <div className="size-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(253,182,35,0.3)]">
            <Lock className="text-white" size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">
            Administration
          </h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">
            Secure Access Point
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 italic">
              Identifiant
            </label>
            <Input
              name="email"
              type="email"
              placeholder="operator@gmail.com"
              className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary transition-all text-white font-medium italic placeholder:text-gray-700"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end ml-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                Clé de sécurité
              </label>
              <Link
                href=""
                className="text-[9px] font-bold text-gray-600 uppercase hover:text-white transition-colors"
              >
                Oubliée ?
              </Link>
            </div>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary transition-all text-white placeholder:text-gray-700"
              required
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold italic"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase italic text-sm hover:scale-[1.02] transition-transform active:scale-95 shadow-[0_0_20px_rgba(253,182,35,0.2)]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <ShieldCheck className="animate-pulse" size={18} />
                Vérification...
              </span>
            ) : (
              "Initialiser la session"
            )}
          </Button>
        </form>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-[10px] font-bold text-gray-600 uppercase tracking-tighter leading-relaxed"
      >
        L&apos;accès non autorisé est strictement surveillé. <br />
        En vous connectant, vous acceptez nos{" "}
        <Link href="" className="text-gray-400 underline underline-offset-4">
          protocoles de sécurité
        </Link>
        .
      </motion.p>
    </div>
  );
}
