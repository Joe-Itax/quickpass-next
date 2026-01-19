"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { MoveLeft, Lock, ShieldCheck, Loader2Icon } from "lucide-react";
import { LoginForm } from "@/app/admin/components/login-form";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import DataStatusDisplay from "@/components/data-status-display";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const sess = session?.session;

  if (error) {
    return (
      <DataStatusDisplay
        isPending={false}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  if (sess) {
    router.replace(`/admin`);
  }

  return sess || isPending ? (
    <div className="size-full">
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#050505]">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[80%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="w-full absolute top-0 left-0 translate-y-1/2 translate-x-1/2 pt-40">
          <Loader2Icon className="animate-spin text-primary size-10" />
        </div>
      </div>
    </div>
  ) : (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 md:p-10 bg-[#050505] overflow-hidden text-white">
      {/* --- EFFETS D'ARRIÈRE-PLAN --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-sm flex-col gap-8 z-10"
      >
        {/* --- BOUTON RETOUR --- */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/">
            <Button
              variant="ghost"
              className="group text-gray-400 hover:text-white hover:bg-white/5 transition-all gap-2 pl-2"
            >
              <MoveLeft
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Retour à l&apos;accueil
            </Button>
          </Link>
        </motion.div>

        {/* --- LOGO & TITRE --- */}
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className="size-16 bg-linear-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20"
          >
            <Lock className="text-white" size={32} />
          </motion.div>

          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">
              LokaPass
            </h1>
            <p className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">
              Administration
            </p>
          </div>
        </div>

        {/* --- FORMULAIRE --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative"
        >
          {/* Un petit badge de sécurité au-dessus du formulaire pour rassurer */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#050505] px-3 py-1 border border-white/10 rounded-full flex items-center gap-2 z-20">
            <ShieldCheck size={12} className="text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Accès Sécurisé
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-[2.5rem] shadow-2xl">
            <LoginForm />
          </div>
        </motion.div>

        {/* --- FOOTER LOGIN --- */}
        <p className="text-center text-sm text-gray-500">
          Besoin d&apos;aide ?{" "}
          <Link href="" className="text-primary hover:underline font-bold">
            Contactez le support
          </Link>
        </p>
      </motion.div>

      {/* --- SIGNATURE --- */}
      <footer className="absolute bottom-6 text-[10px] uppercase tracking-[0.2em] text-gray-700">
        LokaPass System v2.0 • Carmel Code
      </footer>
    </div>
  );
}
