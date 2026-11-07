import { z } from "zod";

export type PresentationTheme = {
  id: string;
  name: string;
  description: string;
  accent: string;
  surface: string;
  font: string;
  thumbnail: string;
};

export const DEFAULT_THEME_ID = "base";

export const PRESENTATION_THEMES = [
  { id: "base", name: "Original", description: "Capa quase preta e cartões claros com destaque amarelo.", accent: "#FFD400", surface: "#1C1C1C", font: "Calibri", thumbnail: "/template-themes/base.png" },
  { id: "navy-corporate", name: "Azul corporativo", description: "Capa azul-marinho e cartões frios com destaque azul.", accent: "#3BA7F0", surface: "#0F2A44", font: "Segoe UI", thumbnail: "/template-themes/navy-corporate.png" },
  { id: "light-minimal", name: "Claro minimalista", description: "Tudo claro, com capa e encerramento invertidos.", accent: "#2563EB", surface: "#F8FAFC", font: "Arial", thumbnail: "/template-themes/light-minimal.png" },
  { id: "graphite-emerald", name: "Grafite e esmeralda", description: "Grafite com cartões esverdeados e destaque verde.", accent: "#10B981", surface: "#1E2422", font: "Calibri", thumbnail: "/template-themes/graphite-emerald.png" },
  { id: "warm-terracotta", name: "Terracota quente", description: "Espresso e creme com destaque terracota.", accent: "#E07A5F", surface: "#2B1D17", font: "Cambria", thumbnail: "/template-themes/warm-terracotta.png" },
] as const satisfies readonly PresentationTheme[];

export type PresentationThemeId = (typeof PRESENTATION_THEMES)[number]["id"];

const THEME_IDS = PRESENTATION_THEMES.map((theme) => theme.id) as [PresentationThemeId, ...PresentationThemeId[]];

export const themeIdSchema = z.enum(THEME_IDS);

export const generateRequestSchema = z.object({ theme: themeIdSchema.default(DEFAULT_THEME_ID) });

export function isThemeId(value: unknown): value is PresentationThemeId {
  return themeIdSchema.safeParse(value).success;
}

export function normalizeThemeId(value: unknown): PresentationThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME_ID;
}

export function themeById(id: string): PresentationTheme {
  return PRESENTATION_THEMES.find((theme) => theme.id === id) ?? PRESENTATION_THEMES[0];
}
