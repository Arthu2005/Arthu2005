import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CookieConsent } from "@/components/site/CookieConsent";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { getAllSettings, getItems } from "@/lib/content/queries";
import type { ImageValue } from "@/lib/content/fields";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ general, contact, social, footer }, banners] = await Promise.all([getAllSettings(), getItems("banners")]);
  return (
    <>
      <a href="#conteudo" className="sr-only z-[100] rounded-full bg-accent px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Pular para o conteúdo
      </a>
      <Header logo={general.logo as ImageValue} top={<AnnouncementBar banner={banners[0]} />} />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer general={general} contact={contact} social={social} footer={footer} />
      <CookieConsent gaId={process.env.NEXT_PUBLIC_GA_ID || undefined} />
    </>
  );
}
