"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ShieldCheck,
  Zap,
  QrCode,
  ArrowRight,
  Users,
  Check,
  Star,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Lock,
} from "lucide-react";
import { FaqItem } from "@/components/faq-item";
import { ReactNode } from "react";

// Variantes d'animation pour les apparitions successives
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-sans overflow-x-hidden">
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"
        />
        <div className="absolute bottom-0 -right-[5%] w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full" />
      </div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="size-10 rounded-xl bg-linear-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
              <Lock className="text-white" size={22} />
            </div>
            <span className="text-2xl font-black tracking-tighter italic">
              LokaPass
            </span>
          </motion.div>

          <nav className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-widest text-gray-400">
            {["Solutions", "Tarifs", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              href="/login"
              className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary border border-primary/20 px-4 py-2 rounded-lg hover:bg-primary/10 transition-all"
            >
              Accès Gérant
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </motion.div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-accent mb-10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Système Distribué v2.0
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8"
          >
            VOTRE ÉVÉNEMENT, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-blue-400 to-accent">
              ZÉRO FRAUDE.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mx-auto max-w-2xl text-gray-400 text-lg md:text-xl mb-12 leading-relaxed"
          >
            Fini les faux billets et les bousculades. LokaPass sécurise vos
            accès en temps réel avec une technologie simple, rapide et
            infaillible.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link
              href="/scan-portal"
              className="group relative w-full sm:w-auto overflow-hidden rounded-2xl bg-primary px-10 py-5 text-lg font-black uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
            >
              <div className="flex items-center justify-center gap-3">
                <QrCode size={24} />
                Lancer le Scan
              </div>
            </Link>
            <a
              href="#contact"
              className="w-full sm:w-auto px-10 py-5 text-lg font-bold border border-white/10 rounded-2xl hover:bg-white/5 transition-colors"
            >
              Réserver une démo
            </a>
          </motion.div>
        </div>
      </section>

      {/* --- KEY BENEFITS --- */}
      <motion.section
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        id="solutions"
        className="py-24 container mx-auto px-6 grid md:grid-cols-3 gap-8 text-center"
      >
        <BenefitCard
          icon={<ShieldCheck className="text-primary" size={30} />}
          title="Sécurité Totale"
          desc="Chaque billet est unique. Une fois scanné, il devient invalide instantanément pour tout le réseau."
        />
        <BenefitCard
          icon={<Users className="text-accent" size={30} />}
          title="Gestion de Groupes"
          desc="Un seul code pour toute une table VIP. Le système décompte les entrées automatiquement."
        />
        <BenefitCard
          icon={<Zap className="text-blue-400" size={30} />}
          title="Direct & Live"
          desc="Suivez le taux de remplissage en temps réel depuis votre propre tableau de bord gérant."
        />
      </motion.section>

      {/* --- PRICING --- */}
      <section id="tarifs" className="py-32 border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-4xl md:text-6xl font-black mb-16 uppercase italic"
          >
            Nos Forfaits
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            <PriceCard
              title="Standard"
              price="Sur Devis"
              desc="Mariages et fêtes privées."
              features={[
                "Jusqu'à 500 invités",
                "Scanner illimité",
                "Rapport post-event",
              ]}
            />
            <PriceCard
              title="Business"
              price="Populaire"
              desc="Concerts et dîners de gala."
              features={[
                "Invitations illimitées",
                "Gestion des tables",
                "Support Live",
                "Dashboard temps réel",
              ]}
              featured
            />
            <PriceCard
              title="Sur Mesure"
              price="PRO"
              desc="Festivals et grandes foires."
              features={[
                "Accompagnement terrain",
                "Badges VIP",
                "Multi-accès zones",
              ]}
            />
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-32 bg-white/2">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-black mb-12 text-center uppercase tracking-widest text-primary">
            Aide & FAQ
          </h2>
          <div className="space-y-4">
            <FaqItem
              value="q1"
              question="Ai-je besoin d'une connexion internet ?"
              answer="Oui. LokaPass garantit qu'un billet ne soit pas dupliqué en vérifiant chaque scan en ligne en moins de 200ms."
            />
            <FaqItem
              value="q2"
              question="Est-ce compatible avec mon téléphone ?"
              answer="Absolument. Aucune application à installer, cela fonctionne directement dans votre navigateur mobile."
            />
            <FaqItem
              value="q3"
              question="Comment envoyer les invitations ?"
              answer="Générez vos codes sur le portail et envoyez-les en un clic par WhatsApp ou par mail."
            />
          </div>
        </div>
      </section>

      {/* --- CONTACT --- */}
      <section id="contact" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-5xl font-black mb-8 italic">
                PRÊT À <br />
                <span className="text-primary">SÉCURISER ?</span>
              </h2>
              <div className="space-y-6">
                <ContactInfo icon={<Mail />} text="contact@lokapass.cd" />
                <ContactInfo icon={<Phone />} text="+243 820 000 000" />
                <ContactInfo icon={<MapPin />} text="Gombe, Kinshasa" />
              </div>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 space-y-4 shadow-2xl"
            >
              <input
                type="text"
                placeholder="Votre Nom"
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-primary outline-none transition-colors"
              />
              <input
                type="email"
                placeholder="Email de contact"
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-primary outline-none transition-colors"
              />
              <textarea
                placeholder="Détails de l'événement"
                rows={4}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-primary outline-none transition-colors"
              />
              <button className="w-full py-5 bg-primary font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all active:scale-95">
                Envoyer
              </button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-white/5 bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black italic">LokaPass</span>
            <span className="text-gray-600 text-xs ml-4">© 2026 Kinshasa.</span>
          </div>
          <div className="text-gray-500 text-sm">
            Made with ❤️ by{" "}
            <Link
              href="https://carmelcode.vercel.app"
              target="_blank"
              className="font-semibold text-blue-500 hover:underline"
            >
              Carmel Code
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* --- SUB-COMPONENTS --- */

// --- BENEFIT CARD ---
interface BenefitCardProps {
  icon: ReactNode; // On attend un composant déjà rendu comme <ShieldCheck />
  title: string;
  desc: string;
}

const BenefitCard = ({ icon, title, desc }: BenefitCardProps) => (
  <motion.div
    variants={fadeIn}
    whileHover={{ y: -10 }}
    className="p-10 rounded-[2.5rem] bg-white/2 border border-white/5 hover:border-white/10 transition-colors"
  >
    <div className="size-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-4">{title}</h3>
    <p className="text-gray-400">{desc}</p>
  </motion.div>
);

// --- PRICE CARD ---
interface PriceCardProps {
  title: string;
  price: string;
  desc: string;
  features: string[];
  featured?: boolean;
}

const PriceCard = ({
  title,
  price,
  desc,
  features,
  featured = false,
}: PriceCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    whileHover={{ scale: featured ? 1.07 : 1.03 }}
    className={`p-10 rounded-[3rem] border flex flex-col h-full ${
      featured
        ? "border-primary bg-primary/5 shadow-2xl"
        : "border-white/10 bg-white/2"
    } text-left relative`}
  >
    <h3 className="text-2xl font-black mb-2 uppercase">{title}</h3>
    <div className="text-4xl font-black text-primary mb-4 tracking-tighter">
      {price}
    </div>
    <p className="text-gray-400 mb-8 text-sm">{desc}</p>
    <ul className="space-y-4 mb-10 flex-1">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <Check size={16} className="text-accent shrink-0" /> {f}
        </li>
      ))}
    </ul>
    <button
      className={`w-full py-4 rounded-xl font-bold uppercase transition-all ${
        featured
          ? "bg-primary text-white shadow-lg"
          : "border border-white/10 hover:bg-white/5"
      }`}
    >
      Commander
    </button>
  </motion.div>
);

// --- CONTACT INFO ---
interface ContactInfoProps {
  icon: ReactNode;
  text: string;
}

const ContactInfo = ({ icon, text }: ContactInfoProps) => (
  <div className="flex items-center gap-4 text-xl group cursor-pointer">
    <div className="size-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
      <div className="text-primary">{icon}</div>
    </div>
    <span className="text-gray-300 group-hover:text-white transition-colors text-base md:text-xl">
      {text}
    </span>
  </div>
);
