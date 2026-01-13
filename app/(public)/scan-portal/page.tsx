"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function ScanPortalPage() {
  const { data: session } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventId, setEventId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [errorOnEventId, setErrorOnEventId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedId = localStorage.getItem("eventId");
    if (savedId) {
      router.replace(`/${savedId}`);
      return;
    }

    const t1 = setTimeout(() => setLoading(false), 2500);
    const t2 = setTimeout(() => setShowForm(true), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorOnEventId(null);

    if (!eventId.trim()) {
      setErrorOnEventId("Identifiant requis.");
      setIsSubmitting(false);
      return;
    }

    // Simulation d'une petite vérification pour le côté "Pro"
    setTimeout(() => {
      localStorage.setItem("eventId", eventId.toUpperCase());
      router.push(`/${eventId.toUpperCase()}`);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#050505] text-white overflow-hidden relative px-6">
      {/* --- BACKGROUND DYNAMICS --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[80%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="size-20 rounded-2xl bg-linear-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/20 mb-8"
            >
              <Lock size={40} className="text-white" />
            </motion.div>
            <h1 className="text-3xl font-black italic tracking-tighter mb-2">
              LokaPass
            </h1>
            <p className="text-gray-500 font-medium animate-pulse">
              Initialisation du protocole sécurisé...
            </p>
          </motion.div>
        ) : (
          showForm && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md z-10"
            >
              <div className="text-center mb-10">
                <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                  <Lock size={32} className="text-primary" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter mb-4 italic">
                  PORTAIL SCAN
                </h1>
                <p className="text-gray-400">
                  Entrez le code secret de l&apos;événement pour activer le
                  terminal de contrôle.
                </p>
              </div>

              <form
                onSubmit={onSubmit}
                className="space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel
                      htmlFor="eventId"
                      className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block"
                    >
                      CODE ÉVÉNEMENT
                    </FieldLabel>
                    <Input
                      id="eventId"
                      placeholder="EX: GALA-2026-X"
                      className="bg-black/50 border-white/10 h-14 text-lg font-mono tracking-widest uppercase focus:border-primary transition-all"
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                      required
                    />
                    {errorOnEventId && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 text-xs text-red-400 font-bold uppercase tracking-tight"
                      >
                        {errorOnEventId}
                      </motion.p>
                    )}
                  </Field>

                  <Button
                    type="submit"
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-xl transition-all group"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Démarrer le contrôle{" "}
                        <ArrowRight
                          size={18}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </span>
                    )}
                  </Button>
                </FieldGroup>

                <div className="relative py-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <span className="relative bg-[#050505] px-4 text-[10px] uppercase tracking-[0.3em] text-gray-600">
                    Administration
                  </span>
                </div>

                <Link
                  href={!session ? "/login" : "/admin"}
                  className="flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  {session
                    ? "Tableau de bord gérant"
                    : "Connexion organisateur"}
                  <ShieldCheck size={16} />
                </Link>
              </form>
            </motion.div>
          )
        )}
      </AnimatePresence>

      <footer className="absolute bottom-8 text-[10px] uppercase tracking-[0.2em] text-gray-600">
        Engineered by{" "}
        <Link
          href="https://carmelcode.vercel.app"
          target="_blank"
          className="text-primary hover:text-white transition-colors font-bold"
        >
          Carmel Code
        </Link>
      </footer>
    </div>
  );
}
