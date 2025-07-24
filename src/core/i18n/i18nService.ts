import { flatten, unflatten } from 'flat';
import fs from 'fs';
import path from 'path';

type TranslationResources = Record<string, Record<string, string>>;
type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ar' | 'ru';

export class I18nService {
  private static instance: I18nService;
  private resources: TranslationResources = {};
  private currentLanguage: LanguageCode = 'en';

  private constructor() {
    this.loadTranslations();
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  private loadTranslations(): void {
    const localesPath = path.join(process.cwd(), 'public/locales');
    const languages = fs.readdirSync(localesPath);

    languages.forEach((lang) => {
      const langPath = path.join(localesPath, lang);
      const files = fs.readdirSync(langPath);

      this.resources[lang] = {};

      files.forEach((file) => {
        if (file.endsWith('.json')) {
          const content = JSON.parse(
            fs.readFileSync(path.join(langPath, file), 'utf-8')
          );
          this.resources[lang] = {
            ...this.resources[lang],
            ...flatten(content)
          };
        }
      });
    });
  }

  public setLanguage(lang: LanguageCode): void {
    if (this.resources[lang]) {
      this.currentLanguage = lang;
    } else {
      console.warn(`Language ${lang} not available, falling back to English`);
      this.currentLanguage = 'en';
    }
  }

  public t(key: string, params?: Record<string, string>): string {
    const translation = this.resources[this.currentLanguage]?.[key] || 
                       this.resources['en'][key] || 
                       key;

    if (!params) return translation;

    return Object.entries(params).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
      translation
    );
  }

  public getAvailableLanguages(): { code: LanguageCode; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'ja', name: '日本語' },
      { code: 'zh', name: '中文' },
      { code: 'ar', name: 'العربية' },
      { code: 'ru', name: 'Русский' }
    ];
  }
}