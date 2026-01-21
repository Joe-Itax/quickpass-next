"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoveLeft, Home, ShieldAlert, ZapOff } from "lucide-react";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] overflow-hidden p-6">
      {/* EFFET DE GRILLE EN ARRIÈRE-PLAN */}
      <div className="absolute inset-0 bg-[url(/bg-1.svg)] bg-center bg-cover opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient(circle_at_center,_transparent_0%,_#050505_100%) pointer-events-none" />

      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        {/* ICONE GLITCH */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse" />
          <div className="relative size-32 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-xl">
            <ZapOff className="text-red-500" size={48} />
          </div>
        </motion.div>

        {/* TEXTE PRINCIPAL */}
        <div className="space-y-4">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-8xl md:text-9xl font-black italic uppercase tracking-tighter text-white/10 select-none"
          >
            404
          </motion.h1>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight text-white">
              Secteur Introuvable
            </h2>
            <p className="text-gray-500 text-sm md:text-base font-bold uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
              La passerelle demandée est inexistante ou a été déclassée par le
              système.
            </p>
          </motion.div>
        </div>

        {/* ACTIONS */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
        >
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full h-14 px-8 rounded-2xl bg-primary font-black uppercase italic tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(253,182,35,0.3)]">
              <Home className="mr-2" size={18} /> Accueil
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => history.back()}
            className="w-full sm:w-auto h-14 px-8 rounded-2xl border-white/10 bg-white/5 text-white hover:text-white font-black uppercase italic tracking-widest hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <MoveLeft className="mr-2" size={18} /> Précédent
          </Button>
        </motion.div>

        {/* FOOTER TECHNIQUE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.4 }}
          className="pt-12 flex items-center justify-center gap-2 text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest"
        >
          <ShieldAlert size={12} />
          Error_Code: 0x000404_NULL_POINTER
        </motion.div>
      </div>
    </main>
  );
}
