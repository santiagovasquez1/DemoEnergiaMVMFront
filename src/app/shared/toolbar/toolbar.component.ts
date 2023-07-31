import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { fromEvent, map, Observable, Subscription } from 'rxjs';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';

import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit, OnDestroy {
  tipoContrato: TiposContratos
  observerWidth: Observable<number>;
  subscriptionWidth: Subscription;
  showOptions: boolean = false;
  @Output() onOpenEvent: EventEmitter<void>;

  constructor(private languageService: LanguageService) {
    this.tipoContrato = parseInt(localStorage.getItem('tipoAgente')) as TiposContratos;
    this.onOpenEvent = new EventEmitter<void>();
  }

  ngOnDestroy(): void {
    if (this.subscriptionWidth) {
      this.subscriptionWidth.unsubscribe();
    }
  }

  // TRADUCCIONES
  private languageSubs: Subscription;

  actualLanguage: string = 'es';

  ngOnInit(): void {
    this.languageSubs = this.languageService.language.subscribe({
      next: language => {
        console.log('language: ', language);
        this.actualLanguage = language;
      },
      error: err => {
        console.log(err);
      }
    });

    this.languageService.get('hello').subscribe((res: string) => {
      console.log(res);
    });

    this.getWindowWidth(window.innerWidth);

    this.observerWidth = fromEvent(window, 'resize').pipe(
      map(() => {
        return window.innerWidth;
      })
    );

    this.subscriptionWidth = this.observerWidth.subscribe({
      next: (data) => {
        this.getWindowWidth(data);
      }
    })
  }

  switchLanguage(language: string) {
    this.languageService.changeLanguage(language);
  }

  onOpenClick() {
    this.onOpenEvent.emit();
  }

  private getWindowWidth(data: number) {
    if (data <= 767.98) {
      this.showOptions = true;
    } else {
      this.showOptions = false;
    }
  }
}
