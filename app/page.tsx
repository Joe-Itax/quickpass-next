"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  // ShieldCheck,
  QrCode,
  ArrowRight,
  // Users,
  Check,
  Mail,
  Phone,
  // MapPin,
  Lock,
  Zap,
  Star,
  // Eye,
  Smartphone,
  Gem,
  Rocket,
  Activity,
  // RefreshCw,
  HelpCircle,
} from "lucide-react";
import { FaqItem } from "@/components/faq-item";
import { authClient } from "@/lib/auth-client";

export default function LandingPage() {
  const { data: session } = authClient.useSession();
  const sess = session?.session;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-sans overflow-x-hidden">
      {/* --- EFFETS DE FOND --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* --- NAVIGATION --- */}
      <header className="fixed w-full top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-linear-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
              <Lock className="text-white" size={20} />
            </div>
            <span className="text-2xl font-black tracking-tighter italic">
              LokaPass
            </span>
          </div>

          <nav className="hidden md:flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
            <Link
              href="#concept"
              className="hover:text-primary transition-colors"
            >
              Le Concept
            </Link>
            <Link
              href="#tarifs"
              className="hover:text-primary transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="#contact"
              className="hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </nav>

          <Link
            href={sess ? "/admin" : "/login"}
            className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] bg-white text-black px-6 py-3 rounded-full hover:bg-primary hover:text-white transition-all shadow-xl"
          >
            {sess ? "Mon Dashboard" : "Accès Gérant"}
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </header>

      {/* --- HERO --- */}
      <section className="relative pt-44 pb-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-12"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Solution Leader à Kinshasa
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10 uppercase italic"
          >
            L&apos;ENTRÉE SANS <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-blue-400 to-white text-not-italic">
              SOUCIS.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mx-auto max-w-2xl text-gray-400 text-lg md:text-2xl mb-16 leading-relaxed font-medium"
          >
            Éliminez les fraudes, les doublons et le désordre. Un système
            intelligent qui synchronise vos entrées en temps réel.
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/scan-portail"
              className="group w-full sm:w-auto rounded-full bg-primary px-12 py-6 text-lg font-black uppercase tracking-tighter hover:scale-105 transition-all shadow-[0_20px_50px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3"
            >
              <QrCode size={20} /> Lancer le Scan
            </Link>
            <a
              href="#contact"
              className="w-full sm:w-auto px-12 py-6 text-lg font-black uppercase tracking-tighter border border-white/10 rounded-full hover:bg-white/5 transition-all"
            >
              Parler à un expert
            </a>
          </div>
        </div>
      </section>

      {/* --- SECTION MÉTRIQUES : LA PREUVE PAR LES CHIFFRES --- */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <MetricItem
              value="10k+"
              label="Scans réussis"
              desc="Zéro faille détectée"
            />
            <MetricItem
              value="250ms"
              label="Temps de réponse"
              desc="Validation instantanée"
            />
            <MetricItem
              value="100%"
              label="Anti-Fraude"
              desc="Doublons impossibles"
            />
            <MetricItem
              value="24/7"
              label="Disponibilité"
              desc="Système toujours actif"
            />
          </div>
        </div>
      </section>

      {/* --- SECTION CONCEPT --- */}
      <section id="concept" className="py-32 bg-white/2">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-6">
              Comment ça marche ?
            </h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              Trois étapes vers la tranquillité
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <ConceptCard
              step="01"
              icon={<Zap className="text-yellow-400" />}
              title="Créez vos invitations"
              desc="Générez des codes QR uniques pour vos invités ou vos tables VIP en quelques secondes."
            />
            <ConceptCard
              step="02"
              icon={<Smartphone className="text-primary" />}
              title="Scannez à l'entrée"
              desc="Vos agents utilisent leurs propres téléphones. Aucune application lourde à installer."
            />
            <ConceptCard
              step="03"
              icon={<Activity className="text-accent" />}
              title="Suivez en direct"
              desc="Visualisez le taux de remplissage et les arrivées en temps réel sur votre dashboard."
            />
          </div>
        </div>
      </section>

      {/* --- TARIFS --- */}
      <section id="tarifs" className="py-32">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-20 uppercase italic">
            Nos Forfaits
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <PriceCard
              icon={<Rocket className="text-gray-400" />}
              title="Starter"
              price="Gratuit"
              desc="Parfait pour découvrir la puissance de l'outil."
              features={[
                "1 Événement actif",
                "1 Terminal de scan",
                "Max 100 personnes attendues",
                "Support Standard",
              ]}
            />
            <PriceCard
              icon={<Star className="text-white" />}
              title="Event Pro"
              price="200$"
              desc="Le choix préféré des mariages et soirées VIP."
              features={[
                "3 Événements simultanés",
                "5 Terminaux par événement",
                "Max 300 personnes / événement",
                "Dashboard Live & Statistiques",
                "Gestion des plans de table",
              ]}
              featured
            />
            <PriceCard
              icon={<Gem className="text-primary" />}
              title="Elite"
              price="Sur Devis"
              desc="Pour les festivals et grands rassemblements publics."
              features={[
                "Événements illimités",
                "Terminaux illimités",
                "Capacité sur-mesure",
                "Accompagnement terrain",
                "Exportation complète des données",
              ]}
            />
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="py-32 bg-white/2">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center gap-4 mb-16 justify-center">
            <HelpCircle className="text-primary" size={40} />
            <h2 className="text-4xl md:text-5xl font-black uppercase italic">
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-4">
            <FaqItem
              value="q1"
              question="Le nombre d'invitations est-il limité ?"
              answer="Non. Ce qui compte, c'est la capacité totale de personnes attendues (peopleCount) définie par votre forfait."
            />
            <FaqItem
              value="q2"
              question="Puis-je avoir plusieurs entrées ?"
              answer="Oui ! Avec le forfait Pro, vous pouvez connecter jusqu'à 5 téléphones en même temps sur différentes portes."
            />
            <FaqItem
              value="q3"
              question="Que se passe-t-il si un code est scanné deux fois ?"
              answer="Le système alerte immédiatement le contrôleur avec un signal rouge 'Déjà Scanné', empêchant toute fraude."
            />
          </div>
        </div>
      </section>

      {/* --- CONTACT --- */}
      <section id="contact" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-linear-to-b from-gray-900 to-black rounded-[4rem] p-10 md:p-20 border border-white/10 shadow-3xl lg:flex gap-16">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <h2 className="text-5xl font-black mb-8 italic uppercase leading-tight">
                Besoin de <br />
                <span className="text-primary">conseils ?</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10">
                Nos experts vous aident à choisir la meilleure configuration
                pour votre événement.
              </p>
              <div className="space-y-6 font-bold">
                <div className="flex items-center gap-4 hover:text-primary transition-colors cursor-pointer">
                  <Mail /> contact@lokapass.cd
                </div>
                <div className="flex items-center gap-4 hover:text-primary transition-colors cursor-pointer">
                  <Phone /> +243 820 000 000
                </div>
              </div>
            </div>
            <form className="lg:w-1/2 space-y-4">
              <input
                type="text"
                placeholder="Nom Complet"
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-primary outline-none transition-all font-bold"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-primary outline-none transition-all font-bold"
              />
              <textarea
                rows={4}
                placeholder="Votre message..."
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-primary outline-none transition-all font-bold"
              />
              <button className="w-full py-6 bg-primary font-black uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all">
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-white/5 text-center">
        <div className="text-2xl font-black italic mb-4">LokaPass</div>
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">
          © 2026 Kinshasa • Crafted by Carmel Code
        </p>
      </footer>
    </div>
  );
}

/* --- SUB-COMPONENTS --- */

const ConceptCard = ({
  step,
  icon,
  title,
  desc,
}: {
  step: string;
  icon: ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="relative p-10 rounded-[3rem] bg-white/3 border border-white/5 group hover:border-primary/30 transition-all">
    <div className="absolute -top-6 -right-6 text-7xl font-black text-white/5 group-hover:text-primary/10 transition-colors">
      {step}
    </div>
    <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-4">{title}</h3>
    <p className="text-gray-400 leading-relaxed font-medium">{desc}</p>
  </div>
);

interface PriceCardProps {
  title: string;
  price: string;
  desc: string;
  features: string[];
  featured?: boolean;
  icon: ReactNode;
}

const PriceCard = ({
  title,
  price,
  desc,
  features,
  featured = false,
  icon,
}: PriceCardProps) => (
  <div
    className={`p-10 rounded-[3.5rem] border text-left flex flex-col transition-all hover:-translate-y-2.5 ${featured ? "bg-primary border-primary text-white shadow-2xl shadow-primary/20 scale-105" : "bg-white/2 border-white/10"}`}
  >
    <div
      className={`size-14 rounded-2xl flex items-center justify-center mb-8 ${featured ? "bg-white/20" : "bg-white/5"}`}
    >
      {icon}
    </div>
    <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-4 opacity-70">
      {title}
    </h3>
    <div className="text-5xl font-black mb-6 italic">{price}</div>
    <p
      className={`mb-10 text-sm font-medium ${featured ? "text-white/80" : "text-gray-400"}`}
    >
      {desc}
    </p>
    <div className="space-y-4 mb-12 flex-1">
      {features.map((f: string, i: number) => (
        <div key={i} className="flex items-center gap-3 text-[13px] font-bold">
          <Check
            size={14}
            className={featured ? "text-white" : "text-primary"}
          />{" "}
          {f}
        </div>
      ))}
    </div>
    <button
      className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer ${featured ? "bg-white text-primary hover:bg-gray-100" : "bg-white/5 hover:bg-white/10"}`}
    >
      Démarrer
    </button>
  </div>
);

const MetricItem = ({
  value,
  label,
  desc,
}: {
  value: string;
  label: string;
  desc: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="text-center"
  >
    <div className="text-4xl md:text-6xl font-black text-primary mb-2 italic tracking-tighter">
      {value}
    </div>
    <div className="text-sm md:text-base font-black uppercase tracking-widest mb-1">
      {label}
    </div>
    <div className="text-xs text-gray-500 font-medium uppercase tracking-tighter">
      {desc}
    </div>
  </motion.div>
);