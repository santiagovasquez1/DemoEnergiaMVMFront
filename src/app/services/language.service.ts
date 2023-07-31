import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  currentLanguage: string;
  language: BehaviorSubject<string>;

  constructor(private translate: TranslateService) {
    let storedLanguage = localStorage.getItem('current-language');
    this.currentLanguage = storedLanguage == null ? 'en': storedLanguage;
    this.language = new BehaviorSubject(this.currentLanguage);
    this.translate.setDefaultLang(this.currentLanguage);
  }

  changeLanguage(language: string) {
    localStorage.setItem('current-language', language);
    this.translate.use(language);
    this.language.next(language);
  }

  get(key: string | Array<string>) {
    return this.translate.get(key);
  }
}