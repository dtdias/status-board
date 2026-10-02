import { BrandLogo } from "@/components/brand-logo";
import { SignOutButton } from "@/components/navigation/sign-out-button";

export function AccountToolbar() {
  return (
    <header className="account-toolbar" aria-label="Navegação da conta">
      <BrandLogo href="/app" compact />
      <SignOutButton />
    </header>
  );
}
