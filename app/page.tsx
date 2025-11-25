"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";

export default function RootPage() {
  const { data: session } = authClient.useSession();
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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!eventId.trim()) {
      return setErrorOnEventId("Veuillez entrer un ID d'événement valide.");
    }

    // const form = e.currentTarget;
    // const formData = new FormData(form);
    // // const eventId = String(formData.get("eventId") ?? "").trim();
    localStorage.setItem("eventId", eventId);
    router.push(`/${eventId}/scan`);
  };

  return (
    <div className="flex flex-col px-4 items-center justify-center size-full text-center relative overflow-hidden text-[#333] bg-[#FDB623] bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover">
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
            {/* <div className="space-y-3 px-6 w-72 mx-auto">
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
            </div> */}
            <form onSubmit={onSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="eventId" className="text-hite/90">
                    Identifiant de l&apos;événement
                  </FieldLabel>
                  <Input
                    id="eventId"
                    name="eventId"
                    type="text"
                    placeholder="Ex: EVENT-123ABC"
                    className="placeholder:tet-white/60 text-hite/80"
                    onChange={(e) => setEventId(e.target.value)}
                    required
                  />
                </Field>
                {errorOnEventId && (
                  <p className="mt-1 text-xs text-red-600">{errorOnEventId}</p>
                )}
                <Field>
                  <Button
                    type="submit"
                    variant={"secondary"}
                    disabled={loading}
                  >
                    {loading ? "Connexion..." : "Continuer"}
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Ou
                </FieldSeparator>
                <p>
                  {session
                    ? "Acceder au panneau d'administration"
                    : "Se connecter au panneau d'administration "}{" "}
                  <Link
                    href={`${!session ? "/login" : "/admin"}`}
                    className="text-black font-bold underline"
                  >
                    Ici
                  </Link>
                  .
                </p>
              </FieldGroup>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-2 text-xs">
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
