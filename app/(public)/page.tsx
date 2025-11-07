"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [eventId, setEventId] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-gradient-to-b from-blue-50 to-white">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8 text-gray-800"
      >
        🎟️ QuickPass
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 w-64"
      >
        <Input
          placeholder="Entrez l'ID de l'événement"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        />
        <Button
          className="w-full"
          disabled={!eventId}
          onClick={() => router.push(`/${eventId}/scan`)}
        >
          Get Started
        </Button>
      </motion.div>
    </div>
  );
}
