// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// export function StatCard({
//   title,
//   value,
//   icon,
// }: {
//   title: string;
//   value: string | number;
//   icon: React.ReactNode;
// }) {
//   return (
//     <Card className="bg-black/20 border-none text-white/80 shadow-md shadow-black">
//       <CardHeader className="flex flex-row justify-between items-center pb-2">
//         <CardTitle className="text-sm">{title}</CardTitle>
//         {icon}
//       </CardHeader>
//       <CardContent>
//         <div className="text-2xl font-bold">{value}</div>
//       </CardContent>
//     </Card>
//   );
// }
// app/admin/components/stat-card.tsx
import { motion } from "motion/react";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  delay?: number;
  color?: string;
}

export function StatCard({
  title,
  value,
  icon,
  delay = 0,
  color = "text-primary",
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/3 border border-white/10 rounded-4xl p-6 backdrop-blur-md relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>

      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
        {title}
      </p>

      <div className="flex items-end justify-between">
        <h3 className={`text-4xl font-black italic tracking-tighter ${color}`}>
          {value}
        </h3>
        <div className={`p-2 rounded-xl bg-white/5 ${color}`}>{icon}</div>
      </div>
    </motion.div>
  );
}
