import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-paper">
      <div className="pointer-events-none absolute right-[-10%] top-1/2 -z-10 h-[60vmin] w-[60vmin] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_28%,#56645c_0%,#0e1511_32%,#000_70%)] shadow-[inset_-20px_-30px_60px_rgba(0,0,0,.85),inset_16px_20px_40px_rgba(166,226,46,.18)]" aria-hidden="true" />
      <div className="container-x">
        <p className="eyebrow">Erro 404</p>
        <h1 className="mt-6 max-w-2xl text-h1 font-semibold">Esta página escorreu por entre os dedos.</h1>
        <p className="mt-6 max-w-lg text-lg text-steel">O endereço pode ter mudado ou a página não existe mais. Use os links abaixo para continuar.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className={buttonClass("primary", "lg")}>
            Ir para a página inicial
          </Link>
          <Link href="/carreiras/vagas" className={buttonClass("secondary", "lg")}>
            Ver vagas
          </Link>
          <Link href="/contato" className={buttonClass("ghost", "lg")}>
            Contato
          </Link>
        </div>
      </div>
    </main>
  );
}
