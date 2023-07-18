import { Component, OnInit } from '@angular/core';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent{
  title = 'DemoEnergiaMVM';

  constructor(private languageService: LanguageService) { }

  ngOnInit(): void {
    this.languageService.get('hello').subscribe((res: string) => {
      console.log(res);
    });
  }

  // Agrega esta función
  switchLanguage(language: string) {
    this.languageService.changeLanguage(language);
  }
}

