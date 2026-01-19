"use client";

import { motion } from "motion/react";
import { User, UserCheck, Users, UserX, LucideIcon } from "lucide-react";

interface MiniCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  loading: boolean;
  delay: number;
}

function MiniCard({
  title,
  value,
  icon: Icon,
  colorClass,
  loading,
  delay,
}: MiniCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/3 border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-2xl"
    >
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          {title}
        </p>
        <div className={`p-2 rounded-xl bg-white/5 ${colorClass}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-3xl font-black italic uppercase tracking-tighter text-white">
        {loading ? (
          <div className="h-8 w-12 bg-white/10 animate-pulse rounded-md" />
        ) : (
          value
        )}
      </div>
    </motion.div>
  );
}

export default function StatCard({
  invitationsTotal,
  invitationsUnscanned,
  invitationsPartial,
  invitationsComplete,
  personsTotalCapacity,
  personsTotalScanned,
  personsRemaining,
  loading,
}: {
  invitationsTotal: number;
  invitationsUnscanned: number;
  invitationsPartial: number;
  invitationsComplete: number;
  personsTotalCapacity: number;
  personsTotalScanned: number;
  personsRemaining: number;
  loading: boolean;
}) {
  return (
    <div className="space-y-8">
      {/* --- SECTION INVITATIONS --- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            Invitations (Groupes)
          </h2>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniCard
            title="Total"
            value={invitationsTotal}
            icon={Users}
            colorClass="text-amber-400"
            loading={loading}
            delay={0.1}
          />
          <MiniCard
            title="Non scannés"
            value={invitationsUnscanned}
            icon={UserX}
            colorClass="text-red-400"
            loading={loading}
            delay={0.2}
          />
          <MiniCard
            title="Partiels"
            value={invitationsPartial}
            icon={User}
            colorClass="text-blue-400"
            loading={loading}
            delay={0.3}
          />
          <MiniCard
            title="Terminés"
            value={invitationsComplete}
            icon={UserCheck}
            colorClass="text-green-400"
            loading={loading}
            delay={0.4}
          />
        </div>
      </section>

      {/* --- SECTION PERSONNES --- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            Flux Personnes (Individus)
          </h2>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MiniCard
            title="Attendues"
            value={personsTotalCapacity}
            icon={Users}
            colorClass="text-purple-400"
            loading={loading}
            delay={0.5}
          />
          <MiniCard
            title="Présentes"
            value={personsTotalScanned}
            icon={UserCheck}
            colorClass="text-emerald-400"
            loading={loading}
            delay={0.6}
          />
          <MiniCard
            title="En attente"
            value={personsRemaining}
            icon={User}
            colorClass="text-yellow-400"
            loading={loading}
            delay={0.7}
          />
        </div>
      </section>
    </div>
  );
}
