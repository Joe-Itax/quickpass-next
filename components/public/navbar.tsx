"use client";
import { PlusCircle, History } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Navbar = () => {
  const pathname = usePathname();

  const eventId = pathname.split("/")[1]; // ex: /12345/scan

  // const go = (route: string) => router.push(`/${eventId}/${route}`);

  return (
    <nav className="w-full px-4 flex justify-center items-center fixed bottom-0 pb-10">
      <div className="left-0 w-full xs:w-fit m-auto bg-[#333] flex justify-center gap-40 xs:gap-52 py-4 px-8 rounded-2xl shadow-sm border-b-4 border-[#FDB623]">
        <Link
          href={`/${eventId}/generate`}
          className="flex flex-col items-center text-white"
        >
          <PlusCircle className="size-8" />
          <span className="text-xs">Générer</span>
        </Link>
        <Link
          href={`/${eventId}/scan`}
          className="flex flex-col items-center text-blue-600 absolute -top-1/2"
        >
          <div className="size-18 bg-[#FDB623] rounded-full flex items-center justify-center drop-shadow-[0_0_21px_#FDB623] p-4">
            <Image
              src="/logo-app/logo-white.svg"
              alt="QuickPass"
              width={100}
              height={100}
              className="m-auto w-full"
            />
          </div>
        </Link>
        <Link
          href={`/${eventId}/history`}
          className="flex flex-col items-center text-white"
        >
          <History className="size-8" />
          <span className="text-xs">Historique</span>
        </Link>
      </div>
    </nav>
  );
};
