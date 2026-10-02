import Link from "next/link";
import type { Route } from "next";
import { SignOutButton } from "@/components/navigation/sign-out-button";

export function AccountToolbar() {
  return (
    <header className="account-toolbar" aria-label="Navegação da conta">
      <Link className="account-brand" href={"/app" as Route}>Status Board</Link>
      <SignOutButton />
    </header>
  );
}
