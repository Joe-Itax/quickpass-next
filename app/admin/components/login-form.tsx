import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white/90">
            Bienvenu à l&apos;administration
          </CardTitle>
          <CardDescription className="text-white/80">
            Connectez-vous pour accéder au panneau d&apos;administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                {/* Or continue with */}
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email" className="text-white/90">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  className="placeholder:text-white/60 text-white/80"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className="text-white/90">
                    Mot de passe
                  </FieldLabel>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="placeholder:text-white/60 text-white/80"
                  required
                />
              </Field>
              <Field>
                <Button type="submit">Se connecter</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-white/80">
        En cliquant sur &quot;Se connecter&quot;, vous acceptez les{" "}
        <Link href="" className="underline-offset-4 hover:underline">
          Conditions d&apos;utilisation
        </Link>{" "}
        et la{" "}
        <Link href="" className="underline-offset-4 hover:underline">
          Politique de confidentialité
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
