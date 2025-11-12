import { Navbar } from "@/components/public/navbar";

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <main className="size-full">
        {children}
        <Navbar />
      </main>
    </div>
  );
}
