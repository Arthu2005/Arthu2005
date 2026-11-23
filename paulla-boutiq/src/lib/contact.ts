import { BRAND } from "@/config/brand";
import type { Product } from "@/types/catalog";

export interface ContactTarget {
  href: string;
  label: string;
  channel: "whatsapp" | "instagram";
}

/** Link de interesse em uma peça: WhatsApp com mensagem pronta ou, como fallback, o Instagram da marca. */
export function interestLink(product?: Pick<Product, "name" | "id">, size?: string | null): ContactTarget {
  if (BRAND.whatsappNumber) {
    const lines = product
      ? [`Olá, Paulla! Tenho interesse na peça *${product.name}* (ref. ${product.id.toUpperCase()})${size ? `, tamanho ${size}` : ""}.`, "Pode me ajudar com disponibilidade e prova?"]
      : ["Olá, Paulla! Gostaria de atendimento personalizado."];
    return {
      href: `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(lines.join(" "))}`,
      label: "Consultar pelo WhatsApp",
      channel: "whatsapp",
    };
  }
  return { href: BRAND.instagram.url, label: "Consultar pelo Instagram", channel: "instagram" };
}

const priceFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function formatPrice(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents) || cents <= 0) return "Valor sob consulta";
  return priceFormatter.format(cents / 100);
}
