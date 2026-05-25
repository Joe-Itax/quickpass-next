"use client";

import { ReactNode, useState, FormEvent } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Mail,
  Gem,
  MessageCircle,
  ShieldCheck,
  Loader2,
  Fingerprint,
  QrCode,
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
    <div className="min-h-screen bg-[#0B0D19] text-white selection:bg-primary/30 font-sans overflow-x-hidden">
      {/* --- BACKGROUND DYNAMICS --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#1E2445]/30 blur-[150px] rounded-full" />
      </div>

      {/* --- NAVIGATION --- */}
      <header className="fixed w-full top-0 z-50 border-b border-white/5 bg-[#0B0D19]/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link href={"/"} className="flex items-center gap-2">
            <div className="size-10 max-[390px]:size-8 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary/10">
              <Image
                src={`/logo-app/icon-1024-no_background.png`}
                width={40}
                height={40}
                alt="Logo YambiPass"
                className="w-full p-1"
              />
            </div>
            <p className="text-2xl max-[390px]:text-xl tracking-tighter">
              <span className="font-black">Yambi</span>
              <span className="font-light">Pass</span>
            </p>
          </Link>

          <nav className="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
            <a
              href="#experience"
              className="hover:text-primary transition-colors"
            >
              L&apos;Expérience
            </a>
            <a
              href="#integral"
              className="hover:text-primary transition-colors"
            >
              Service Intégral
            </a>
            <a href="#faq" className="hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>

          <Link
            href={sess ? "/admin" : "/login"}
            className="group flex items-center gap-3 text-[10px] max-[390px]:text-[8px] font-black uppercase tracking-[0.2em] bg-white text-[#0B0D19] px-6 max-[390px]:px-4 py-3 max-[390px]:py-2 rounded-full hover:bg-primary hover:text-white transition-all shadow-xl"
          >
            {sess ? "Dashboard" : "Connexion"}
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </header>

      {/* --- HERO --- */}
      <section className="relative pt-52 pb-32 text-center">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Infrastructure d&apos;Hospitalité Premium
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl max-[390px]:text-4xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8"
          >
            L&apos;ACCUEIL, ÉLEVÉ <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#C5A880] to-[#E8D5B5] italic">
              AU RANG D&apos;ART.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-gray-400 text-lg md:text-xl mb-14 leading-relaxed font-light"
          >
            Offrez à vos invités une entrée magistrale. Oubliez les listes
            papier et le chaos à la porte. Nous allions l&apos;élégance du
            protocole à la précision technologique pour des événements sans
            friction.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-6"
          >
            <a
              href="#contact"
              className="rounded-full bg-primary px-10 py-5 text-sm font-black uppercase tracking-widest text-[#0B0D19] hover:scale-105 transition-all shadow-[0_15px_40px_rgba(197,168,128,0.2)] flex items-center gap-3"
            >
              Planifier mon événement
            </a>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION MÉTRIQUES / VALEURS --- */}
      <section className="py-20 border-y border-white/5 bg-white/2">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <MetricItem
            value="Zéro"
            label="Attente"
            desc="Fluidité absolue à l'entrée"
          />
          <MetricItem
            value="100%"
            label="Contrôle"
            desc="Accès exclusif et sécurisé"
          />
          <MetricItem
            value="Live"
            label="Supervision"
            desc="Suivi des arrivées en direct"
          />
          <MetricItem
            value="Sur-Mesure"
            label="Protocole"
            desc="Placement & zones VIP"
          />
        </div>
      </section>

      {/* --- L'EXPÉRIENCE (LE FLUX) --- */}
      <section id="experience" className="py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              L&apos;EXPÉRIENCE{" "}
              <span className="text-primary italic">YAMBIPASS</span>
            </h2>
            <p className="text-gray-400 font-light tracking-widest text-sm uppercase">
              De l&apos;invitation au sourire d&apos;accueil
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              icon={<Fingerprint size={32} strokeWidth={1.5} />}
              title="1. Personnalisation"
              desc="Importez vos listes. Nous créons des pass numériques uniques respectant l'identité visuelle de votre événement. Tables et zones d'accès paramétrables selon vos besoins."
            />
            <StepCard
              icon={<QrCode size={32} strokeWidth={1.5} />}
              title="2. Distribution Élégante"
              desc="Vos invités reçoivent leur Pass d'Accès sécurisé directement via WhatsApp ou Email. Une première impression moderne et haut de gamme."
            />
            <StepCard
              icon={<ShieldCheck size={32} strokeWidth={1.5} />}
              title="3. Accueil Magistral"
              desc="Un scan instantané sur nos terminaux valide l'entrée, affiche le placement exact de l'invité et informe l'hôte. Fini les recherches hasardeuses sur papier."
            />
          </div>
        </div>
      </section>

      {/* --- L'OFFRE OPÉRÉE --- */}
      <section id="integral" className="py-32 bg-white/2">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="relative p-10 md:p-20 rounded-[3rem] bg-[#0f1225] border border-white/5 shadow-2xl overflow-hidden group">
            <div className="absolute -top-10 -right-10 p-12 text-primary/5 group-hover:rotate-12 transition-transform duration-700">
              <Gem size={300} strokeWidth={1} />
            </div>

            <div className="relative z-10">
              <div className="inline-block border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
                Prestation Gant Blanc
              </div>
              <h3 className="text-3xl md:text-5xl font-black mb-6">
                YambiPass <span className="text-primary italic">Intégral</span>
              </h3>
              <p className="text-gray-400 text-lg font-light mb-12 max-w-2xl">
                Vous êtes l&apos;hôte, soyez l&apos;hôte. Confiez-nous la
                responsabilité technique et protocolaire de vos accès. Notre
                équipe déploie l&apos;infrastructure et gère la porte pour vous.
              </p>

              <div className="grid md:grid-cols-2 gap-x-12 gap-y-5 mb-14 text-sm font-medium text-gray-300">
                {[
                  "Configuration complète de la base",
                  "Génération & Envoi des Pass",
                  "Mise à disposition du matériel de scan",
                  "Superviseurs YambiPass sur site",
                  "Gestion dynamique des imprévus",
                  "Rapport de présence analytique post-événement",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Check className="text-primary" size={18} /> {f}
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/5">
                <div className="text-left">
                  <div className="text-3xl font-black text-white">
                    Sur Devis
                  </div>
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mt-1">
                    Adapté à l&apos;envergure de l&apos;événement
                  </div>
                </div>
                <a
                  href="#contact"
                  className="w-full md:w-auto py-5 px-10 bg-primary text-[#0B0D19] rounded-full font-black uppercase tracking-widest hover:bg-white transition-all text-center text-xs"
                >
                  Consulter un expert
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="py-32">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black uppercase tracking-widest mb-4">
              Questions Fréquentes
            </h2>
            <div className="h-1 w-12 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="space-y-4">
            {/* <FaqItem
              value="f1"
              question="Remplacez-vous le designer de mes invitations ?"
              answer="Non. Si vous avez déjà un designer, nous intégrons simplement le QR Code et les informations dynamiques dans votre invitation. Si vous n’en avez pas, nous pouvons aussi vous proposer une invitation numérique directement intégrée à la plateforme."
            /> */}
            <FaqItem
              value="f2"
              question="Le placement à table est-il obligatoire ?"
              answer="Non. YambiPass s’adapte à votre format. Pour un mariage ou un gala, vous pouvez organiser les invités par tables. Pour une conférence ou un événement libre, le système fonctionne aussi sans placement fixe."
            />
            <FaqItem
              value="f3"
              question="Que se passe-t-il si un invité perd son invitation ou n’a plus de batterie ?"
              answer="Nos opérateurs peuvent retrouver l’invité directement dans la base et valider son accès en quelques secondes. La fluidité de l’accueil reste garantie."
            />
            <FaqItem
              value="f4"
              question="Le système fonctionne-t-il avec une connexion internet instable ?"
              answer="Le service est conçu pour tenir compte des contraintes de connectivité. Le fonctionnement principal repose sur une validation en temps réel, avec des mécanismes d’adaptation pensés pour les environnements à réseau limité."
            />
          </div>
        </div>
      </section>

      {/* --- CONTACT --- */}
      <section id="contact" className="py-32 bg-[#080a13]">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="">
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                VOTRE PROCHAIN <br />
                ÉVÉNEMENT{" "}
                <span className="text-primary italic">SANS FAILLE.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-12 font-light">
                Discutons de vos besoins protocolaires et dimensionnons
                l&apos;infrastructure idéale pour vos invités.
              </p>

              <div className="space-y-8">
                <Link
                  href="mailto:josephitakala18@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-6 group"
                >
                  <div className="size-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                      Email
                    </div>
                    <div className="font-medium text-lg">
                      yambipass@gmail.com
                    </div>
                  </div>
                </Link>

                <Link
                  href="https://wa.me/+243982430975"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-6 group"
                >
                  <div className="size-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                      WhatsApp Direct
                    </div>
                    <div className="font-medium text-lg">+243 98 24 30 975</div>
                  </div>
                </Link>
              </div>
            </div>

            <form
              onSubmit={handleContactSubmit}
              className="space-y-5 bg-white/2 p-4 sm:p-8 md:p-12 rounded-4xl border border-white/5"
            >
              <h3 className="text-2xl font-bold mb-6">Briefing initial</h3>
              <input
                type="email"
                placeholder="Adresse Email *"
                className="w-full bg-[#0B0D19] border border-white/10 p-5 rounded-xl outline-none focus:border-primary transition-colors text-sm"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Type d'événement (ex: Gala, Mariage, Conférence) *"
                className="w-full bg-[#0B0D19] border border-white/10 p-5 rounded-xl outline-none focus:border-primary transition-colors text-sm"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Nombre d'invités estimé *"
                className="w-full bg-[#0B0D19] border border-white/10 p-5 rounded-xl outline-none focus:border-primary transition-colors text-sm"
                value={guestsCount}
                onChange={(e) => setGuestsCount(e.target.value)}
                required
              />
              <textarea
                rows={4}
                placeholder="Date, lieu et exigences protocolaires..."
                className="w-full bg-[#0B0D19] border border-white/10 p-5 rounded-xl outline-none focus:border-primary transition-colors text-sm resize-none"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
              <Button
                disabled={isSubmitting}
                type="submit"
                className="w-full py-6 bg-primary text-[#0B0D19] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all mt-4"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Soumettre la demande"
                )}
              </Button>

              {formStatus === "success" && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center mt-4">
                  <p className="text-emerald-400 font-bold text-sm">
                    ✓ Demande de protocole initiée avec succès.
                  </p>
                </div>
              )}

              {formStatus === "error" && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center mt-4">
                  <p className="text-red-400 font-bold text-sm">
                    Une erreur de transmission est survenue.
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t border-white/5 text-center flex flex-col items-center justify-center gap-4">
        <Image
          src="/logo-app/icon-1024-no_background.png"
          width={80}
          height={80}
          alt="YambiPass Icon"
          className=""
        />
        <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-600">
          © {new Date().getFullYear()} YambiPass •{" "}
          <Link href="https://carmelcode.vercel.app" target="_blank">
            CarmelCode
          </Link>{" "}
          • Kinshasa
        </div>
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
  <div className="flex flex-col items-center">
    <div className="text-4xl md:text-5xl font-black text-primary mb-3 font-mono tracking-tighter">
      {value}
    </div>
    <div className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 text-white">
      {label}
    </div>
    <div className="text-xs text-gray-500 font-light max-w-37.5">{desc}</div>
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
  <div className="p-8 md:p-10 rounded-4xl bg-white/2 border border-white/5 hover:bg-white/4 transition-all group">
    <div className="size-14 rounded-full bg-white/5 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-500">
      {icon}
    </div>
    <h4 className="text-xl font-bold mb-4 tracking-wide">{title}</h4>
    <p className="text-gray-400 text-sm leading-relaxed font-light">{desc}</p>
  </div>
);
