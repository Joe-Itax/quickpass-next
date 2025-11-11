import { Navbar } from "@/components/public/navbar";

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="size-full flex flex-col bg-[#333333]/84">
      <div className="size-full">
        <main className="flex-1 size-full">
          {children}
          <Navbar />
        </main>
      </div>
    </div>
  );
}
