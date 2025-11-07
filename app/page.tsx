"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function RootPage() {
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [errorOnEventId, setErrorOnEventId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Vérifie si un eventId existe déjà dans le localStorage
    const savedId = localStorage.getItem("eventId");
    if (savedId) {
      router.replace(`/${savedId}/scan`);
      return;
    }

    // Simule le chargement avant d'afficher le formulaire
    const t1 = setTimeout(() => setLoading(false), 3000);
    const t2 = setTimeout(() => setShowForm(true), 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  const handleSubmit = () => {
    if (!eventId.trim()) {
      return setErrorOnEventId("Veuillez entrer un ID d'événement valide.");
    }
    localStorage.setItem("eventId", eventId);
    router.push(`/${eventId}/scan`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#FDB623] text-center relative overflow-hidden text-[#333]">
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Image
                src="/logo-app/logo-white.svg"
                alt="QuickPass"
                width={100}
                height={100}
                className="m-auto"
              />
            </motion.div>
            <div className="mt-8 flex flex-col justify-center items-center gap-4">
              <h1 className="text-4xl font-black">QuickPass</h1>
              <h2 className="text-3xl font-bold">Démarer</h2>

              <p className="text-xl font-semibold text-[#3E3E42]/60">
                Allez profiter de nos fonctionnalités gratuitement et
                simplifiez-vous la vie avec nous
              </p>
            </div>
          </motion.div>
        )}

        {!loading && showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <Image
              src="/logo-app/logo-white.svg"
              alt="QuickPass"
              width={100}
              height={100}
              className="m-auto"
            />
            <h1 className="text-4xl font-black text-inherit">QuickPass</h1>
            <p className="text-inherit text-sm px-8">
              Entrez l’identifiant de votre événement pour accéder à la zone de
              scannage.
            </p>
            <div className="space-y-3 px-6 w-72 mx-auto">
              <div>
                <Input
                  placeholder="Ex: EVENT-123ABC"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                />
                {errorOnEventId && (
                  <p className="mt-1 text-xs text-red-600">{errorOnEventId}</p>
                )}
              </div>
              <Button onClick={handleSubmit} className="w-full">
                Continuer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-6 text-xs">
        powered by{" "}
        {/* <span className="font-semibold text-blue-700 pointer-events-none">
          QuickPass
        </span> */}
        <Link
          href={"https://carmelcode.vercel.app"}
          target="_blank"
          className="font-semibold text-blue-700"
        >
          Carmel Code
        </Link>
      </footer>
    </div>
  );
}
