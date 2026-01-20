"use client";

import { RefreshCcw, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";

interface dataStatusDisplayProps {
  isPending?: boolean;
  hasError?: boolean;
  showContent?: boolean;
  errorObject?: Error | null;
  refetch?: () => void;
}

export default function DataStatusDisplay({
  isPending,
  hasError,
  showContent = true,
  errorObject,
  refetch,
}: dataStatusDisplayProps) {
  if (hasError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-8"
        >
          {/* Effet de lueur rouge en arrière-plan */}
          <div className="absolute inset-0 bg-red-600 blur-[60px] opacity-20" />
          <div className="relative size-24 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-2xl">
            <ShieldAlert className="text-red-500" size={48} />
          </div>
        </motion.div>

        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
            Interruption Système
          </h2>
          <div className="space-y-2">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">
              Échec de la récupération des données
            </p>
            {errorObject?.message && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 font-mono text-[10px] text-red-400/80 break-all">
                ERR_LOG: {errorObject.message}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-6">
          <Button
            onClick={() => {
              if (refetch) refetch();
              else window.location.reload();
            }}
            className="h-12 px-10 rounded-2xl bg-white text-black font-black uppercase italic text-xs tracking-widest hover:bg-primary hover:text-white transition-all group"
          >
            <RefreshCcw className="mr-2 size-4 group-hover:rotate-180 transition-transform duration-500" />
            Réinitialiser la requête
          </Button>

          <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest leading-relaxed">
            Si l&apos;erreur persiste, vérifiez votre liaison <br /> ou
            contactez le support technique.
          </p>
        </div>
      </div>
    );
  }

  if (isPending || !showContent) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col justify-center items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary blur-2xl opacity-10 animate-pulse" />
          <Loader2 className="text-primary animate-spin size-12" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">
            Initialisation
          </span>
          <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">
            Accès au flux de données sécurisé...
          </span>
        </div>
      </div>
    );
  }

  return null;
}
