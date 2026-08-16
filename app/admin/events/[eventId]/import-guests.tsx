"use client";

import { useState, useRef } from "react";
import {
  FileUp,
  Check,
  AlertCircle,
  Loader2,
  X,
  FileSpreadsheet,
  Download,
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

interface ImportedGuest extends Partial<Invitation> {
  tableName?: string; // Le nom de la table à assigner
}

export interface FileValidationError {
  rowNumber: number;
  columnName: string;
  columnLetter: string;
  message: string;
  cellValue?: string;
}

type ImportGuestsProps = {
  eventId: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export default function ImportGuests({
  eventId,
  open,
  onOpenChange,
  hideTrigger = false,
}: ImportGuestsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = open ?? internalOpen;
  const setDialogOpen = onOpenChange ?? setInternalOpen;
  const [isReading, setIsReading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedGuest[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    FileValidationError[]
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: createInvitations, isPending } =
    useCreateInvitations(eventId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset précédent
    setPreviewData([]);
    setValidationErrors([]);
    setIsReading(true);

    const workbook = new ExcelJS.Workbook();

    try {
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1); // Première feuille

      if (!worksheet || worksheet.rowCount < 2) {
        setValidationErrors([
          {
            rowNumber: 1,
            columnName: "Fichier",
            columnLetter: "-",
            message:
              "Le fichier Excel est vide ou ne contient aucune ligne de données après l'en-tête.",
          },
        ]);
        toast.error("Le fichier Excel ne contient aucune donnée valide.");
        return;
      }

      const guests: ImportedGuest[] = [];
      const errors: FileValidationError[] = [];

      // Helper d'extraction propre des valeurs d'une cellule
      const getRawValue = (cell: ExcelJS.Cell) => {
        const val = cell.value;
        if (val && typeof val === "object" && "text" in val)
          return val.text?.toString();
        return val?.toString();
      };

      // Helper pour détecter et ignorer automatiquement les lignes de notes / consignes
      const isIgnoredRow = (rawText: string) => {
        if (!rawText) return false;
        const lower = rawText.trim().toLowerCase();
        return (
          lower.startsWith("note") ||
          lower.startsWith("instruction") ||
          lower.startsWith("consigne") ||
          lower.startsWith("remarque") ||
          lower.includes("col a") ||
          lower.includes("col b") ||
          lower.includes("obligatoire")
        );
      };

      // Parcours ligne par ligne
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Sauter le header

        const label = getRawValue(row.getCell(1))?.trim();
        const rawCount = getRawValue(row.getCell(2))?.trim();
        const rawEmail = getRawValue(row.getCell(3))?.trim();
        let rawWhatsapp = getRawValue(row.getCell(4))?.trim();
        const tableName = getRawValue(row.getCell(5))?.trim();

        // Si la ligne contient des consignes ou une note explicative, on la saute silencieusement !
        if (label && isIgnoredRow(label)) {
          return;
        }

        // 1. Validation Nom (Colonne A) - OBLIGATOIRE
        if (!label) {
          errors.push({
            rowNumber,
            columnName: "Nom de l'invité",
            columnLetter: "A",
            message: "Le nom de l'invité est obligatoire et ne peut être vide.",
          });
          return;
        }

        // 2. Validation PAX (Colonne B) - OBLIGATOIRE (nombre entier >= 1)
        let count = 1;
        if (rawCount) {
          const parsed = Number(rawCount);
          if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1) {
            errors.push({
              rowNumber,
              columnName: "Nombre de places (PAX)",
              columnLetter: "B",
              message: `La valeur '${rawCount}' n'est pas un nombre entier supérieur ou égal à 1.`,
              cellValue: rawCount,
            });
          } else {
            count = parsed;
          }
        }

        // 3. Validation Email (Colonne C) - OPTIONNEL (mais format strict si renseigné)
        if (rawEmail) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(rawEmail)) {
            errors.push({
              rowNumber,
              columnName: "Email",
              columnLetter: "C",
              message: `L'adresse email '${rawEmail}' n'est pas au format valide (ex: exemple@domaine.com).`,
              cellValue: rawEmail,
            });
          }
        }

        // 4. Validation WhatsApp (Colonne D) - OPTIONNEL (mais format strict si renseigné)
        if (rawWhatsapp) {
          rawWhatsapp = rawWhatsapp.replace(/\s+/g, "");
          if (!rawWhatsapp.startsWith("+")) {
            rawWhatsapp = `+${rawWhatsapp}`;
          }

          const phoneDigits = rawWhatsapp.replace(/[^0-9]/g, "");
          const phoneRegex = /^\+?[0-9().-]{7,24}$/;

          if (!phoneRegex.test(rawWhatsapp) || phoneDigits.length < 7) {
            errors.push({
              rowNumber,
              columnName: "Téléphone WhatsApp",
              columnLetter: "D",
              message: `Le numéro WhatsApp '${rawWhatsapp}' est invalide (doit comporter au moins 7 chiffres et un format valide).`,
              cellValue: rawWhatsapp,
            });
          }
        }

        if (label) {
          guests.push({
            label,
            peopleCount: count,
            email: rawEmail || undefined,
            whatsapp: rawWhatsapp || undefined,
            eventId: eventId,
            tableName: tableName || undefined,
          });
        }
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
        setPreviewData([]);
        toast.error(
          `Fichier non conforme : ${errors.length} erreur(s) détectée(s).`,
        );
      } else {
        setValidationErrors([]);
        setPreviewData(guests);
        toast.success(
          `${guests.length} invités conformes prêts pour l'importation`,
        );
      }
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
      await createInvitations(previewData as unknown as Invitation[]);
      toast.success("Importation et allocation des tables réussies !");
      setPreviewData([]);
      setValidationErrors([]);
      setDialogOpen(false);
    } catch (e) {
      console.log("Error during massive import:", e);
      toast.error("L'importation a échoué. Vérifiez le format des données.");
    } finally {
      setIsReading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      // ----- FEUILLE 1 : Données Invités -----
      const worksheet = workbook.addWorksheet("Données Invités");

      // En-têtes avec largeur optimisée
      worksheet.columns = [
        { header: "Nom de l'invité", key: "name", width: 28 },
        { header: "Nombre de places", key: "pax", width: 20 },
        { header: "Email", key: "email", width: 28 },
        { header: "Téléphone WhatsApp", key: "whatsapp", width: 25 },
        { header: "Nom de la table (optionnel)", key: "table", width: 28 },
      ];

      // Styling en-tête
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46D6" },
      };

      // Commentaires / Tooltips d'aide sur les cellules d'en-tête
      worksheet.getCell("A1").note =
        "OBLIGATOIRE : Nom complet de l'invité ou nom du groupe.";
      worksheet.getCell("B1").note =
        "OBLIGATOIRE : Nombre entier de places >= 1 (Par défaut: 1).";
      worksheet.getCell("C1").note =
        "OPTIONNEL : Adresse email valide (ex: invite@exemple.com).";
      worksheet.getCell("D1").note =
        "OPTIONNEL : Numéro WhatsApp avec indicatif (ex: +243123456789).";
      worksheet.getCell("E1").note =
        "OPTIONNEL : Nom de la table assignée (ex: Table V.I.P).";

      // Exemples de lignes de démonstration
      const examples = [
        {
          name: "Jean Dupont",
          pax: 2,
          email: "jean@example.com",
          whatsapp: "+243123456789",
          table: "Table A",
        },
        {
          name: "Marie Martin",
          pax: 1,
          email: "marie@example.com",
          whatsapp: "+243987654321",
          table: "Table B",
        },
        {
          name: "Groupe Société",
          pax: 5,
          email: "contact@societe.com",
          whatsapp: "+243555666777",
          table: "Table C",
        },
      ];

      examples.forEach((ex) => {
        worksheet.addRow(ex);
      });

      // Ligne de note explicative automatique (qui sera automatiquement ignorée lors de l'import si laissée)
      const noteRow = worksheet.addRow([
        "NOTES: Le nom (Col A) et le nombre de places (Col B >= 1) sont obligatoires. L'email (Col C), WhatsApp (Col D) et Table (Col E) sont optionnels. Cette ligne d'explication est automatiquement ignorée lors de l'importation.",
      ]);
      noteRow.font = {
        italic: true,
        color: { argb: "FF666666" },
        size: 9,
      };

      // ----- FEUILLE 2 : Consignes & Guide -----
      const guideSheet = workbook.addWorksheet("Consignes & Guide");
      guideSheet.columns = [
        { header: "Colonne", key: "col", width: 12 },
        { header: "Nom de la colonne", key: "name", width: 25 },
        { header: "Statut", key: "status", width: 15 },
        { header: "Description & Règle de validation", key: "desc", width: 60 },
      ];

      const guideHeader = guideSheet.getRow(1);
      guideHeader.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      guideHeader.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF10B981" },
      };

      guideSheet.addRows([
        {
          col: "A",
          name: "Nom de l'invité",
          status: "OBLIGATOIRE",
          desc: "Doit comporter le nom complet de l'invité ou du groupe. Ne peut pas être vide.",
        },
        {
          col: "B",
          name: "Nombre de places",
          status: "OBLIGATOIRE",
          desc: "Doit être un nombre entier positif au moins égal à 1 (ex: 1, 2, 5).",
        },
        {
          col: "C",
          name: "Email",
          status: "OPTIONNEL",
          desc: "Adresse email pour l'envoi de l'invitation. Si renseignée, doit respecter un format d'email valide.",
        },
        {
          col: "D",
          name: "Téléphone WhatsApp",
          status: "OPTIONNEL",
          desc: "Numéro de téléphone WhatsApp avec indicatif pays. Au moins 7 chiffres requis.",
        },
        {
          col: "E",
          name: "Nom de la table",
          status: "OPTIONNEL",
          desc: "Nom de la table assignée. Si la table n'existe pas encore, elle sera automatiquement créée par le système.",
        },
      ]);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Template_Import_Invites.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Modèle Excel avec guide téléchargé !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du téléchargement du modèle");
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all"
          >
            <FileUp className="mr-2 size-4 text-primary" /> Import Excel
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <FileSpreadsheet className="text-primary" size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black italic uppercase text-white">
                  Importation Massive
                </DialogTitle>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  Norme : Nom (A), PAX (B), Email (C), WhatsApp (D), Table (E)
                </p>
              </div>
            </div>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              size="sm"
              className="border-primary/20 text-primary hover:bg-primary/90 hover:text-black font-black uppercase italic text-[10px] whitespace-nowrap"
            >
              <Download className="size-3 mr-2" /> Template
            </Button>
          </div>
        </DialogHeader>

        <div className="p-8 overflow-y-auto flex-1">
          {validationErrors.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-black uppercase text-xs">
                  <AlertCircle size={18} />
                  <span>
                    Fichier non conforme ({validationErrors.length} erreur(s)
                    détectée(s))
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 font-bold leading-relaxed">
                  L&apos;importation a été bloquée. Corrigez les lignes
                  non-conformes ci-dessous dans votre fichier Excel puis
                  réessayez.
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4">
                {validationErrors.map((err, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-xs flex items-start gap-3"
                  >
                    <span className="font-mono font-black text-red-400 bg-red-500/20 px-2.5 py-0.5 rounded text-[10px] shrink-0">
                      Ligne {err.rowNumber} | Col {err.columnLetter}
                    </span>
                    <div className="flex-1">
                      <span className="font-black uppercase text-white mr-1.5 text-[11px]">
                        {err.columnName} :
                      </span>
                      <span className="text-gray-300 font-medium text-[11px]">
                        {err.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => {
                  setValidationErrors([]);
                  setPreviewData([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  fileInputRef.current?.click();
                }}
                variant="outline"
                className="w-full h-12 rounded-2xl border-white/10 font-black uppercase italic text-xs tracking-widest"
              >
                Choisir un autre fichier Excel
              </Button>
            </div>
          ) : previewData.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-white/10 rounded-4xl p-12 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
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
                  Aperçu des données conformes ({previewData.length} lignes)
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewData([]);
                    setValidationErrors([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
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
                      <th className="p-3 text-[9px] font-black text-gray-500 uppercase italic">
                        Table
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
                        <td className="p-3 text-[9px] font-medium text-orange-400">
                          {guest.tableName || "—"}
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
                  Colonnes conformes aux normes : <br />
                  <span className="text-white">
                    1. Nom (Col A) | 2. PAX (Col B) | 3. Email (Col C) | 4.
                    WhatsApp (Col D) | 5. Table (Col E)
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
          <Button
            variant="ghost"
            onClick={() => setDialogOpen(false)}
            className="text-gray-500 font-bold uppercase text-[10px]"
          >
            Fermer
          </Button>
          <Button
            disabled={
              previewData.length === 0 ||
              validationErrors.length > 0 ||
              isPending
            }
            onClick={handleImport}
            className="bg-primary rounded-2xl font-black uppercase italic text-xs px-8 h-12 transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
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
