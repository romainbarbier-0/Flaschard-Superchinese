export const LANG_META: Record<string, { emoji: string; label: string; bcp47: string }> = {
  ko: { emoji: '🇰🇷', label: 'Coréen', bcp47: 'ko-KR' },
  en: { emoji: '🇬🇧', label: 'Anglais', bcp47: 'en-US' },
  ja: { emoji: '🇯🇵', label: 'Japonais', bcp47: 'ja-JP' },
  es: { emoji: '🇪🇸', label: 'Espagnol', bcp47: 'es-ES' },
  de: { emoji: '🇩🇪', label: 'Allemand', bcp47: 'de-DE' },
  it: { emoji: '🇮🇹', label: 'Italien', bcp47: 'it-IT' },
  zh: { emoji: '🇨🇳', label: 'Chinois', bcp47: 'zh-CN' },
  fr: { emoji: '🇫🇷', label: 'Français', bcp47: 'fr-FR' },
};

export function langMeta(code: string) {
  return LANG_META[code] ?? { emoji: '🌐', label: code.toUpperCase(), bcp47: code };
}
