"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Lock,
  Loader2,
  ShieldAlert,
  ChevronLeft,
  MonitorSmartphone,
} from "lucide-react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function ScanPortalPage() {
  const [loading, setLoading] = useState(true);
  const [eventCode, setEventCode] = useState("");
  const [terminalCode, setTerminalCode] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();

  // Validation au chargement si localStorage présent
  useEffect(() => {
    const checkSavedAccess = async () => {
      const savedEvent = localStorage.getItem("eventCode");
      const savedTerminal = localStorage.getItem("terminalCode");

      if (savedEvent && savedTerminal) {
        try {
          const res = await fetch("/api/events/validate-access", {
            method: "POST",
            body: JSON.stringify({
              eventCode: savedEvent,
              terminalCode: savedTerminal,
            }),
          });
          if (res.ok) {
            router.replace(`/scan-portail/${savedEvent}`);
            return;
          }
        } catch (e) {
          console.error("Auto-validation failed: ", e);
        }
      }
      setLoading(false);
      setTimeout(() => setShowForm(true), 300);
    };

    checkSavedAccess();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventCode.trim() || !terminalCode.trim()) return;

    setIsValidating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/events/validate-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventCode: eventCode.trim(),
          terminalCode: terminalCode.trim(),
        }),
      });

      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
        return;
      }

      if (res.ok) {
        localStorage.setItem("eventCode", eventCode.trim());
        localStorage.setItem("terminalCode", terminalCode.trim());
        localStorage.setItem("eventName", data.eventName);
        localStorage.setItem(
          "terminalName",
          data.terminalName || terminalCode.trim(),
        );
        router.push(`/scan-portail/${eventCode.trim()}`);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Codes invalides.");
      }
    } catch (err) {
      console.log("erreur: ", err);

      setErrorMsg(`Erreur réseau. Réessayez.`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#050505] text-white overflow-hidden relative px-6">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[80%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      {/* --- HEADER --- */}
      <div className="p-6 flex fixed w-full top-0 left-0 justify-between items-center backdrop-blur-md border-b border-white/10">
        <Button
          onClick={() => router.push("/")}
          className="size-10 rounded-full bg-white/5 flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </Button>
        <div className="text-center">
          <h1 className="font-black italic uppercase text-primary tracking-tighter">
            Portail Scan
          </h1>
        </div>
        <div className="size-10" />
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="size-20 rounded-2xl bg-linear-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl mb-8"
            >
              <Lock size={40} className="text-white" />
            </motion.div>
            <h1 className="text-3xl font-black italic tracking-tighter mb-2">
              LokaPass
            </h1>
            <p className="text-gray-500 font-medium">
              Vérification de l&apos;accès...
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
              <form
                onSubmit={onSubmit}
                className="space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md"
              >
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                    Activation Terminal
                  </h1>
                </div>

                <FieldGroup className="space-y-4">
                  <Field>
                    <FieldLabel className="text-[10px] tracking-widest text-primary font-bold uppercase">
                      Code Événement
                    </FieldLabel>
                    <Input
                      placeholder="afterwork-2026"
                      className="bg-black/50 border-white/10 h-12 text-center font-mono"
                      value={eventCode}
                      onChange={(e) => setEventCode(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-[10px] tracking-widest text-primary font-bold uppercase">
                      Code Terminal
                    </FieldLabel>
                    <div className="relative">
                      <MonitorSmartphone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                        size={18}
                      />
                      <Input
                        placeholder="entree-nord_x82f"
                        className="bg-black/50 border-white/10 h-12 pl-10 text-center font-mono"
                        value={terminalCode}
                        onChange={(e) => setTerminalCode(e.target.value)}
                        required
                      />
                    </div>
                  </Field>

                  {errorMsg && (
                    <p className="text-xs text-red-400 font-bold flex items-center gap-2 justify-center">
                      <ShieldAlert size={14} /> {errorMsg}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-14 bg-primary font-black uppercase tracking-widest"
                    disabled={isValidating}
                  >
                    {isValidating ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Activer le Terminal"
                    )}
                  </Button>
                </FieldGroup>
              </form>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
