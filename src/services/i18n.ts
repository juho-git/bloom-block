import ko from '../data/i18n/ko.json';
import en from '../data/i18n/en.json';
import { loadSave, updateSave } from './save';

const dicts = { ko, en } as const;
export type Lang = keyof typeof dicts;

export function t(key: string, vars?: Record<string, string | number>): string {
  const lang = loadSave().settings.lang;
  const dict = dicts[lang] as Record<string, string>;
  const fallback = dicts.ko as Record<string, string>;
  let s = dict[key] ?? fallback[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}

export function setLang(lang: Lang): void {
  updateSave((s) => {
    s.settings.lang = lang;
  });
}

export function getLang(): Lang {
  return loadSave().settings.lang;
}
