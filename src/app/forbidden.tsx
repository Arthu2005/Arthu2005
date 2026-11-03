import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow justify-center">Acesso negado</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">Você não tem permissão para acessar esta área.</h1>
        <p className="mt-3 text-steel">Se precisar deste acesso, fale com um administrador do painel.</p>
        <Link href="/admin" className="mt-8 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white">
          Voltar ao painel
        </Link>
      </div>
    </main>
  );
}
