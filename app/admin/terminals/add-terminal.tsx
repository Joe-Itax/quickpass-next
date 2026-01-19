// "use client";

// import { useState } from "react";
// import { PlusIcon } from "lucide-react";

// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";

// import { useCreateEvent } from "@/hooks/use-event";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// type TerminalFormData = {
//   name: string;
//   event: string;
// };

// export default function AddTerminal() {
//   const [openDialog, setOpenDialog] = useState(false);
//   const [formData, setFormData] = useState<TerminalFormData>({
//     name: "",
//     event: "",
//   });

//   const [errors, setErrors] = useState<Partial<TerminalFormData>>({});
//   const { mutateAsync: createEvent, isPending } = useCreateEvent();

//   const validateForm = (): boolean => {
//     const newErrors: Partial<TerminalFormData> = {};

//     if (!formData.name.trim()) newErrors.name = "Le nom est requis";
//     if (!formData.event.trim()) newErrors.event = "L'événement est requis";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     try {
//       await createEvent({
//         name: formData.name,
//       } as Parameters<typeof createEvent>[0]);

//       setFormData({
//         name: "",
//         event: "",
//       });
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setOpenDialog(false);
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;

//     setFormData((prev) => ({
//       ...prev,
//       [name]: name === "totalCapacity" ? Number(value) : value,
//     }));

//     if (errors[name as keyof TerminalFormData]) {
//       setErrors((prev) => ({ ...prev, [name]: undefined }));
//     }
//   };

//   return (
//     <Dialog open={openDialog} onOpenChange={setOpenDialog}>
//       <DialogTrigger asChild>
//         <Button className="m-auto" variant="outline">
//           <PlusIcon className="-ms-1 opacity-60" size={16} />
//           Ajouter un terminal
//         </Button>
//       </DialogTrigger>

//       <DialogContent className="sm:max-w-md">
//         <DialogHeader className="border-b px-6 py-4">
//           <DialogTitle>Créer un nouveau terminal</DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4 px-6 py-4">
//           {/* Terminal Name */}
//           <div className="space-y-2">
//             <Label htmlFor="name">Nom *</Label>
//             <input
//               id="name"
//               name="name"
//               type="text"
//               value={formData.name}
//               onChange={handleChange}
//               className={`w-full p-2 border rounded ${
//                 errors.name ? "border-red-500" : "border-gray-300"
//               }`}
//             />
//             {errors.name && (
//               <p className="text-red-500 text-sm">{errors.name}</p>
//             )}
//           </div>

//           {/* Event Name */}
//           <div className="space-y-2">
//             <Label htmlFor="event">Evénement *</Label>
//             <Select name="event">
//               <SelectTrigger className="w-full p-2 rounded">
//                 <SelectValue placeholder="Choisir un événement" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="event1">Event1</SelectItem>
//                 <SelectItem value="event2">Event2</SelectItem>
//                 <SelectItem value="event3">Event3</SelectItem>
//               </SelectContent>
//             </Select>
//             {errors.name && (
//               <p className="text-red-500 text-sm">{errors.name}</p>
//             )}
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="border-t px-6 py-4 flex justify-end gap-2">
//           <DialogClose asChild>
//             <Button variant="outline">Annuler</Button>
//           </DialogClose>
//           <Button onClick={handleSubmit} disabled={isPending}>
//             {isPending ? "Création..." : "Créer le terminal"}
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { useCreateTerminal, useEvents } from "@/hooks/use-event"; // Ton hook existant pour lister les events

// UI Components
type Event = {
  id: number | string;
  name: string;
};
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AddTerminal() {
  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState("");
  const [eventId, setEventId] = useState("");

  const { data: events } = useEvents();
  console.log("Events data: ", events);
  const { mutateAsync: createTerminal, isPending } = useCreateTerminal();

  const handleSubmit = async () => {
    if (!name || !eventId) return;

    try {
      await createTerminal({ name, eventId });
      setName("");
      setEventId("");
      setOpenDialog(false);
    } catch (e) {
      alert("Erreur lors de la création");
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-primary text-primary-foreground"
        >
          <PlusIcon className="mr-2" size={16} />
          Ajouter un terminal
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau Terminal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du point de contrôle</Label>
            <Input
              id="name"
              placeholder="Ex: Entrée Principale"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Événement rattaché</Label>
            <Select onValueChange={setEventId} value={eventId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un événement" />
              </SelectTrigger>
              <SelectContent className="">
                {Array.isArray(events) &&
                  events.map((ev: Event) => (
                    <SelectItem key={ev.id} value={ev.id.toString()}>
                      {ev.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="ghost">Annuler</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name || !eventId}
          >
            {isPending ? "Création..." : "Confirmer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
