// Réseaux pris en charge, avec leurs limites de texte (source : recon.md, options par réseau).
export const NETWORKS = {
  instagram: { label: "Instagram", short: "IG", maxChars: 2200 },
  facebook: { label: "Facebook", short: "FB", maxChars: 16192 },
  linkedin: { label: "LinkedIn", short: "LI", maxChars: 3000 },
  bluesky: { label: "Bluesky", short: "BS", maxChars: 300 },
  youtube: { label: "YouTube", short: "YT", maxChars: 5000 },
  tiktok: { label: "TikTok", short: "TT", maxChars: 2000 },
  whatsapp: { label: "WhatsApp", short: "WA", maxChars: 1024 },
  telegram: { label: "Telegram", short: "TG", maxChars: 4096 },
} as const;

export type Network = keyof typeof NETWORKS;

export type PostStatus = "published" | "scheduled" | "draft" | "failed" | "autolist" | "review";
