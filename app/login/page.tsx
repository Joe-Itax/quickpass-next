import Link from "next/link";
import Image from "next/image";
import { MoveLeft } from "lucide-react";

import { LoginForm } from "@/app/admin/components/login-form";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover bg-background">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="px-6">
          <Link href={"/"}>
            <Button className="" variant="outline">
              <MoveLeft />
              Accueil
            </Button>
          </Link>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium text-3xl"
        >
          <div className="size-10 bg-[#FDB623] rounded-full flex items-center justify-center drop-shadow-[0_0_21px_#FDB623] p-1.5">
            <Image
              src="/logo-app/logo-white.svg"
              alt="QuickPass"
              width={100}
              height={100}
              className="m-auto w-full"
            />
          </div>
          Quick Scan
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
