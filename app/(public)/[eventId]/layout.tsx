import { Navbar } from "@/components/public/navbar";

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="size-full flex flex-col bg-[url(/image.jpg)] bg-center bg-no-repeat bg-cover">
      <div className="size-full bg-black/60">
        <main className="flex-1 pb-20">{children}</main>
        <Navbar />
      </div>
    </div>
  );
}
