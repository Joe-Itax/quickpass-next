import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function LogoutDialog({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          {/* Overlay avec flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Carte de dialogue */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            {/* Effet de lumière rouge en fond */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-500 blur-lg opacity-50" />

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <LogOut size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic text-white tracking-tight">
                  Déconnexion
                </h3>
                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                  Voulez-vous vraiment déconnecter ce terminal ? <br />
                  <span className="text-red-500/50 text-[9px]">
                    Toutes les données locales seront effacées.
                  </span>
                </p>
              </div>

              <div className="flex flex-col w-full gap-3 pt-4">
                <Button
                  onClick={onConfirm}
                  className="h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest transition-all"
                >
                  Confirmer
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="h-12 rounded-2xl text-gray-400 font-black uppercase italic text-[10px] tracking-widest hover:text-black"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
