"use client";

import { useState, useRef } from "react";
import {
  FileUp,
  //   Table as TableIcon,
  Check,
  AlertCircle,
  Loader2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCreateInvitations } from "@/hooks/use-event";
import { Invitation } from "@/types/types";

export default function ImportGuests({ eventId }: { eventId: number }) {
  const [open, setOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [previewData, setPreviewData] = useState<Partial<Invitation>[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: createInvitations, isPending } =
    useCreateInvitations(eventId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReading(true);
    const workbook = new ExcelJS.Workbook();

    try {
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1); // On prend la première feuille

      const guests: Partial<Invitation>[] = [];

      // On itère sur les lignes (en sautant l'entête)
      worksheet?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        // Fonction helper pour extraire la string pure même si c'est un lien
        const getRawValue = (cell: ExcelJS.Cell) => {
          const val = cell.value;
          if (val && typeof val === "object" && "text" in val)
            return val.text?.toString();
          return val?.toString();
        };

        const label = getRawValue(row.getCell(1));
        const count = parseInt(getRawValue(row.getCell(2)) || "1");
        const rawEmail = getRawValue(row.getCell(3));
        let whatsapp = getRawValue(row.getCell(4));

        // Nettoyage WhatsApp : Ajout du + si absent (ex: 243...)
        if (whatsapp) {
          whatsapp = whatsapp.replace(/\s+/g, ""); // Enlever les espaces
          if (!whatsapp.startsWith("+")) {
            whatsapp = `+${whatsapp}`;
          }
        }

        if (label) {
          guests.push({
            label,
            peopleCount: isNaN(count) ? 1 : count,
            email: rawEmail?.includes("@") ? rawEmail : undefined,
            whatsapp: whatsapp,
            eventId: eventId,
          });
        }
      });

      setPreviewData(guests);

      toast.success(`${guests.length} invités détectés`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la lecture du fichier Excel");
    } finally {
      setIsReading(false);
    }
  };

  const handleImport = async () => {
    setIsReading(true);
    try {
      const data = await createInvitations(previewData as Invitation[]);

      console.log("data after massive import:", data);

      toast.success("Importation réussie !");
      setPreviewData([]);
      setOpen(false);
    } catch (e) {
      console.log("Error during massive import:", e);
      toast.error("L'importation a échoué.");
    } finally {
      setIsReading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all">
          <FileUp className="mr-2 size-4 text-primary" /> Import Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl sm:max-w-2xl">
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <FileSpreadsheet className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-black italic uppercase text-white">
                Importation Massive
              </DialogTitle>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                Format requis: Nom, PAX, Email, WhatsApp
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8">
          {previewData.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-white/10 rounded-4xl p-12 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx"
                className="hidden"
              />
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {isReading ? (
                  <Loader2 className="text-primary animate-spin" />
                ) : (
                  <FileUp
                    className="text-gray-500 group-hover:text-primary"
                    size={32}
                  />
                )}
              </div>
              <p className="text-sm font-black uppercase italic text-white tracking-tight">
                Glissez votre fichier .xlsx ici
              </p>
              <p className="text-[10px] font-bold text-gray-600 uppercase mt-2 tracking-widest">
                Ou cliquez pour parcourir vos dossiers
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-primary uppercase italic">
                  Aperçu des données ({previewData.length} lignes)
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewData([])}
                  className="h-8 text-[9px] font-black uppercase text-red-500 hover:text-red-500 hover:bg-red-500/10"
                >
                  <X className="size-3 mr-1" /> Annuler
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/5 bg-white/2">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0a0a0a] border-b border-white/10">
                    <tr>
                      <th className="p-3 text-[9px] font-black text-gray-500 uppercase italic">
                        N°
                      </th>
                      <th className="p-3 text-[9px] font-black text-gray-500 uppercase italic">
                        Nom
                      </th>
                      <th className="p-3 text-[9px] font-black text-gray-500 uppercase italic">
                        Pax
                      </th>
                      <th className="p-3 text-[9px] font-black text-gray-500 uppercase italic">
                        Email
                      </th>
                      <th className="p-3 text-[9px] font-black text-gray-500 uppercase italic">
                        Whatsapp
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((guest, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 text-[10px] font-bold text-white uppercase italic">
                          {i + 1}
                        </td>
                        <td className="p-3 text-[10px] font-bold text-white uppercase italic">
                          {guest.label}
                        </td>
                        <td className="p-3 text-[10px] font-black text-primary">
                          {guest.peopleCount}
                        </td>
                        <td className="p-3 text-[9px] text-gray-500 font-medium">
                          {guest.email || "—"}
                        </td>
                        <td className="p-3 text-[9px] text-gray-500 font-medium">
                          {guest.whatsapp || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div className="p-3 text-center text-[9px] font-bold text-gray-600 uppercase bg-white/2">
                    + {previewData.length - 10} autres invités...
                  </div>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-4">
                <AlertCircle className="text-primary shrink-0" size={18} />
                <p className="text-[10px] text-primary/80 font-bold uppercase leading-relaxed">
                  Vérifiez bien que les colonnes respectent l&apos;ordre :{" "}
                  <br />
                  <span className="text-white">
                    1. Nom | 2. Nombre de places | 3. Email | 4. Téléphone
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-gray-500 font-bold uppercase text-[10px]"
          >
            Fermer
          </Button>
          <Button
            disabled={previewData.length === 0 || isPending}
            onClick={handleImport}
            className="bg-primary text- rounded-2xl font-black uppercase italic text-xs px-8 h-12 transition-all shadow-lg shadow-primary/10"
          >
            {isPending ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Check className="mr-2" />
            )}
            Lancer l&apos;importation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
