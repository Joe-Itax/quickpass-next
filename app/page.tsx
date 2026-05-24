"use client";

import { ReactNode, useState, FormEvent } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Mail,
  Phone,
  Gem,
  MessageCircle,
  FileText,
  ShieldCheck,
  Send,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { FaqItem } from "@/components/faq-item";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LandingPage() {
  const { data: session } = authClient.useSession();

  const [contactEmail, setContactEmail] = useState("");
  const [eventType, setEventType] = useState("");
  const [guestsCount, setGuestsCount] = useState("");
  const [requirements, setRequirements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contactEmail,
          eventType,
          guests: guestsCount,
          requirements,
        }),
      });

      if (res.ok) {
        setFormStatus("success");
        setContactEmail("");
        setEventType("");
        setGuestsCount("");
        setRequirements("");
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const sess = session?.session;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-sans overflow-x-hidden">
      {/* --- BACKGROUND DYNAMICS --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-primary/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-blue-600/10 blur-[140px] rounded-full" />
      </div>

      {/* --- NAVIGATION --- */}
      <header className="fixed w-full top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link href={"/"} className="flex items-center gap-1">
            {/* <Link href={"/"}> */}
            <div className="size-10 max-[390px]:size-8 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary/20">
              <Image
                src={`/logo-app/icon-1024-no_background.png`}
                width={40}
                height={40}
                alt="Logo YambiPass"
                className="w-full p-1"
              />
            </div>
            <p className="text-2xl max-[390px]:text-xl tracking-tighter">
              <span className="font-black"> Yambi</span>
              <span>Pass</span>
            </p>
            {/* </Link> */}
          </Link>

          <nav className="hidden md:flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <a href="#flux" className="hover:text-primary transition-colors">
              Le Flux
            </a>
            <a href="#tarifs" className="hover:text-primary transition-colors">
              L&apos;Offre
            </a>
            <a href="#faq" className="hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>

          <Link
            href={sess ? "/admin" : "/login"}
            className="group flex items-center gap-3 text-[10px] max-[390px]:text-[8px] font-black uppercase tracking-[0.2em] bg-white text-black px-6 max-[390px]:px-2 py-3 max-[390px]:py-1.5 rounded-full hover:bg-primary hover:text-white transition-all shadow-xl"
          >
            Dashboard
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </header>

      {/* --- HERO --- */}
      <section className="relative pt-48 pb-32 text-center">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-12"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Service Protocolaire • Maîtrise des Flux
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl max-[390px]:text-4xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10 uppercase italic"
          >
            SÉCURISEZ <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-blue-400 to-white text-not-italic">
              VOTRE PORTE.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-3xl text-gray-400 text-lg md:text-2xl mb-16 leading-relaxed font-medium"
          >
            Évitez les invitations frauduleuses et le chaos à l&apos;entrée.{" "}
            <br className="hidden md:block" />
            Nous transformons vos listes en Pass d&apos;Accès numériques et
            opérons le contrôle.
          </motion.p>

          <div className="flex justify-center gap-6">
            <a
              href="#contact"
              className="rounded-full bg-primary px-12 py-6 text-lg font-black uppercase tracking-tighter hover:scale-105 transition-all shadow-[0_20px_50px_rgba(59,130,246,0.3)] flex items-center gap-3"
            >
              Demander un devis <Send size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* --- SECTION MÉTRIQUES --- */}
      <section className="py-24 border-y border-white/5 bg-white/1">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <MetricItem
            value="100%"
            label="Anti-Fraude"
            desc="Doublons impossibles"
          />
          <MetricItem value="<1s" label="Validation" desc="Par invité" />
          <MetricItem value="Zéro" label="Stress" desc="On gère la porte" />
          <MetricItem value="Live" label="Dashboard" desc="Suivi en direct" />
        </div>
      </section>

      {/* --- LE FLUX DE TRAVAIL --- */}
      <section id="flux" className="py-32 bg-white/2">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-6">
              Le Process{" "}
              <span className="text-primary text-not-italic">YambiPass</span>
            </h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">
              De la liste Excel au Scan final
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              icon={<FileText />}
              title="Intégration"
              desc="Envoyez-nous vos listes. Nous créons les Pass d'Accès (QR Codes) avec noms, catégories et tables."
            />
            <StepCard
              icon={<MessageCircle />}
              title="Partage"
              desc="Nous diffusons les Pass (Image/PDF) à vos invités via WhatsApp ou Email pour un accès fluide."
            />
            <StepCard
              icon={<ShieldCheck />}
              title="Contrôle"
              desc="Notre équipe opère sur site avec nos terminaux. On filtre, on scanne, vous profitez de la fête."
            />
          </div>
        </div>
      </section>

      {/* --- L'OFFRE UNIQUE --- */}
      <section id="tarifs" className="py-32">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="relative p-12 md:p-24 rounded-[4rem] bg-linear-to-br from-gray-900 to-black border border-white/10 shadow-3xl overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-12 transition-transform">
              <Gem size={250} />
            </div>

            <div className="relative z-10">
              <h3 className="text-4xl md:text-6xl font-black uppercase italic mb-8">
                YambiPass <span className="text-primary">Operated™</span>
              </h3>
              <p className="text-gray-400 text-xl font-medium mb-12 max-w-2xl">
                Le service complet où nous portons la responsabilité technique
                et protocolaire de vos accès.
              </p>

              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 mb-16 italic font-bold">
                {[
                  "Nettoyage expert des listes",
                  "Génération massive de QR Codes",
                  "Distribution WhatsApp/Email",
                  "Opérateurs de scan sur site",
                  "Gestion des plans de table",
                  "Rapport de présence final",
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 border-b border-white/5 pb-4"
                  >
                    <Check className="text-primary" size={20} /> {f}
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="text-left">
                  <div className="text-5xl font-black italic">Sur Devis</div>
                  <div className="text-xs uppercase font-black text-gray-500 tracking-widest mt-2 italic">
                    Prestige & Sécurité Garantie
                  </div>
                </div>
                <a
                  href="#contact"
                  className="w-full md:w-auto py-6 px-16 bg-white text-black rounded-3xl font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all text-center"
                >
                  Consulter un expert
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="py-32 bg-white/1">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center gap-4 mb-16">
            <HelpCircle className="text-primary" size={40} />
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-4">
            <FaqItem
              value="f1"
              question="Est-ce que vous remplacez mon designer d'invitations ?"
              answer="Non. Votre designer crée l'invitation artistique. Nous fournissons le Pass d'Accès technique (avec le QR) qui permet d'entrer. C'est le duo parfait entre esthétique et sécurité."
            />
            <FaqItem
              value="f2"
              question="Gérez-vous le placement à table ?"
              answer="Oui. Lors du scan à l'entrée, le Pass indique immédiatement à l'hôte d'accueil la table et la zone réservée à l'invité."
            />
            <FaqItem
              value="f3"
              question="Que se passe-t-il si un invité n'a pas reçu son Pass ?"
              answer="En tant que superviseurs sur site, nous avons accès à la base de données maître pour valider l'invité manuellement après vérification d'identité."
            />
          </div>
        </div>
      </section>

      {/* --- CONTACT --- */}
      <section id="contact" className="py-32">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-20">
            <div>
              <h2 className="text-5xl font-black mb-8 italic uppercase leading-tight text-white">
                Le succès n&apos;est pas <br />
                <span className="text-primary">un hasard.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10 font-medium">
                Réservez notre équipe pour votre prochain grand événement.
              </p>
              <div className="space-y-6 font-bold">
                <div className="flex items-center gap-4 hover:text-primary transition-colors cursor-pointer">
                  <Link
                    href="mailto:yambipass@gmail.com"
                    className="flex items-center gap-4"
                    target="_blank"
                  >
                    <Mail />
                    yambipass@gmail.com
                  </Link>
                </div>
                <div className="flex items-center gap-4 hover:text-primary transition-colors cursor-pointer">
                  <Link
                    href={`https://wa.me/+243982430975`}
                    className="flex items-center gap-4"
                    target="_blank"
                  >
                    <Phone /> +243 98 24 30 975
                  </Link>
                </div>
              </div>
            </div>
            <form
              onSubmit={handleContactSubmit}
              className="space-y-4 bg-white/3 p-10 rounded-[3rem] border border-white/10 shadow-3xl"
            >
              <input
                type="email"
                placeholder="Votre email *"
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-primary font-bold"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Type d'événement *"
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-primary font-bold"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Nombre d'invités *"
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-primary font-bold"
                value={guestsCount}
                onChange={(e) => setGuestsCount(e.target.value)}
                required
              />
              <textarea
                rows={4}
                placeholder="Date, lieu et exigences..."
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-primary font-bold"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
              <Button
                disabled={isSubmitting}
                type="submit"
                className="w-full py-6 bg-primary font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-primary/20 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Lancer le briefing"
                )}
              </Button>

              {formStatus === "success" && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-emerald-400 font-bold text-sm">
                    ✓ Votre demande a bien été envoyée !
                  </p>
                  <p className="text-emerald-400/60 text-xs mt-1">
                    Notre équipe vous recontactera sous 24h.
                  </p>
                </div>
              )}

              {formStatus === "error" && (
                <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 font-bold text-sm text-center">
                    Une erreur est survenue. Veuillez réessayer.
                  </p>
                  <p className="text-red-400/60 text-xs mt-2 text-center">
                    Si le problème persiste, contactez-nous directement :
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-3 text-xs">
                    <a
                      href="mailto:yambipass@gmail.com"
                      className="text-red-400 hover:text-white transition-colors flex items-center gap-1.5 font-bold"
                    >
                      <Mail size={14} /> Email
                    </a>
                    <a
                      href="https://wa.me/+243982430975"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-white transition-colors flex items-center gap-1.5 font-bold"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center text-[10px] font-bold uppercase tracking-[0.5em] text-gray-700">
        © {new Date().getFullYear()} YambiPass • Managed by Carmel Code •
        Kinshasa
      </footer>
    </div>
  );
}

/* --- COMPONENTS --- */

const MetricItem = ({
  value,
  label,
  desc,
}: {
  value: string;
  label: string;
  desc: string;
}) => (
  <div>
    <div className="text-5xl font-black text-primary mb-2 italic tracking-tighter">
      {value}
    </div>
    <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-white">
      {label}
    </div>
    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
      {desc}
    </div>
  </div>
);

const StepCard = ({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="p-4 md:p-8 rounded-[3.5rem] bg-white/2 border border-white/5 group hover:border-primary/30 transition-all">
    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all shadow-lg">
      {icon}
    </div>
    <h4 className="text-2xl font-black mb-4 uppercase italic tracking-tight">
      {title}
    </h4>
    <p className="text-gray-400 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);
