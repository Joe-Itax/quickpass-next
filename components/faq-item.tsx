import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqItem({
  question,
  answer,
  value,
}: {
  question: string;
  answer: string;
  value: string;
}) {
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="q1">
      <AccordionItem value={value} className="border-b! border-white/50">
        <AccordionTrigger className="hover:no-underline hover:text-primary cursor-pointer text-xl font-bold">
          {question}
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 ">
          <p>{answer}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
