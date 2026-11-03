import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/site/Logo";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <main className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="on-dark relative hidden overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo inverted />
        <div className="pointer-events-none absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_32%_28%,#56645c_0%,#0e1511_32%,#000_70%)] shadow-[inset_-20px_-30px_60px_rgba(0,0,0,.85),inset_16px_20px_40px_rgba(166,226,46,.18)]" aria-hidden="true" />
        <p className="relative max-w-sm font-display text-3xl font-semibold leading-tight">Painel de conteúdo, vagas e candidaturas.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight lg:mt-0">Entrar no painel</h1>
          <p className="mt-2 text-sm text-steel">Acesso restrito a colaboradores autorizados.</p>
          <LoginForm next={next?.startsWith("/admin") ? next : undefined} />
        </div>
      </div>
    </main>
  );
}
