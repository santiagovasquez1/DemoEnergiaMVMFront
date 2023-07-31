import { Injectable } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { LanguageService } from '../language.service';
import { forkJoin, Subscription } from 'rxjs';
import {OnInit, OnDestroy} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TableService implements OnInit, OnDestroy {
  private paginator: MatPaginator;
  private languageSubs: Subscription;

  labelPaginatorItemsPerPage: string;
  labelPaginatorNextPage: string;
  labelPaginatorPreviousPage: string;
  labelPaginatorFirstPage: string;
  labelPaginatorLastPage: string;

  constructor(public languageService: LanguageService) {}

  ngOnDestroy(): void {
    this.languageSubs.unsubscribe();
  }

  initializeTranslations(): void {
    forkJoin([
      this.languageService.get('Elementos por página'),
      this.languageService.get('Siguiente'),
      this.languageService.get('Anterior'),
      this.languageService.get('Primera'),
      this.languageService.get('Última')
    ]).subscribe({
      next: translatedTexts => {
        this.labelPaginatorItemsPerPage = translatedTexts[0];
        this.labelPaginatorNextPage = translatedTexts[1];
        this.labelPaginatorPreviousPage = translatedTexts[2];
        this.labelPaginatorFirstPage = translatedTexts[3];
        this.labelPaginatorLastPage = translatedTexts[4];
        if (this.paginator) {
          this.setPaginatorTable(this.paginator);
        }
      },
      error: err => {
        console.log(err);
      }
    });
  }

  ngOnInit(): void {
    this.languageSubs = this.languageService.language.subscribe({
      next: language => {
        this.initializeTranslations();
      },
      error: err => {
        console.log(err);
      }
    });
  }

  public setPaginatorTable(paginator: MatPaginator) {
    this.paginator = paginator;
    if (this.labelPaginatorItemsPerPage && this.labelPaginatorNextPage && this.labelPaginatorPreviousPage && this.labelPaginatorFirstPage && this.labelPaginatorLastPage) {
      paginator._intl.itemsPerPageLabel = this.labelPaginatorItemsPerPage;
      paginator._intl.nextPageLabel = this.labelPaginatorNextPage;
      paginator._intl.previousPageLabel = this.labelPaginatorPreviousPage;
      paginator._intl.firstPageLabel = this.labelPaginatorFirstPage;
      paginator._intl.lastPageLabel = this.labelPaginatorLastPage;
      paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
        if (length == 0 || pageSize == 0) {
          return `0 de ${length}`;
        }
        length = Math.max(length, 0);
        const startIndex = page * pageSize;
        const endIndex = startIndex < length ?
          Math.min(startIndex + pageSize, length) :
          startIndex + pageSize;
        return `${startIndex + 1} - ${endIndex} de ${length}`;
      }
    }
  }
}
