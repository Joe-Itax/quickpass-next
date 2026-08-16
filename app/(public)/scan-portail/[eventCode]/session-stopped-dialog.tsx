"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";

export default function SessionStoppedDialog({
  isOpen,
  message,
}: {
  isOpen: boolean;
  message?: string | null;
}) {
  const router = useRouter();

  const handleGoToPortal = () => {
    ["eventCode", "terminalCode", "eventName", "terminalName", "terminalSessionToken"].forEach((k) =>
      localStorage.removeItem(k)
    );
    router.replace("/scan-portail");
  };

  const handleGoHome = () => {
    ["eventCode", "terminalCode", "eventName", "terminalName", "terminalSessionToken"].forEach((k) =>
      localStorage.removeItem(k)
    );
    router.replace("/");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
          {/* Overlay avec flou sombre */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          {/* Carte de dialogue */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0d0d0d] border border-amber-500/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden text-center z-10"
          >
            {/* Effet de lueur ambre en fond */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-amber-500 blur-md opacity-80" />

            <div className="flex flex-col items-center space-y-6">
              {/* Icône d'alerte */}
              <div className="size-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <ShieldAlert size={40} className="animate-pulse" />
              </div>

              {/* Titre & Message */}
              <div className="space-y-3">
                <h3 className="text-2xl font-black uppercase italic text-white tracking-tight">
                  Session Arrêtée
                </h3>
                <p className="text-gray-300 text-xs font-bold leading-relaxed px-2">
                  {message ||
                    "La session de ce terminal a été fermée par un administrateur depuis la plateforme de gestion."}
                </p>
                <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider pt-1">
                  Accès aux scans temporairement suspendu
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col w-full gap-3 pt-2">
                <Button
                  onClick={handleGoToPortal}
                  className="h-14 rounded-2xl bg-primary hover:bg-white text-black font-black uppercase italic tracking-widest transition-all shadow-lg shadow-primary/20"
                >
                  <RefreshCw className="mr-2 size-4" />
                  Portail de connexion
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGoHome}
                  className="h-12 rounded-2xl border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-black uppercase italic text-[10px] tracking-widest transition-all"
                >
                  <Home className="mr-2 size-4" />
                  Page d&apos;accueil
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
