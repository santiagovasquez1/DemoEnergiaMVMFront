import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import {
  catchError,
  EMPTY,
  finalize,
  from,
  OperatorFunction,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { BonoCarbonoInfo } from 'src/app/models/BonoCarbonoInfo';
import { InfoContrato } from 'src/app/models/infoContrato';
import { CertificadorContractService } from 'src/app/services/certificador-contract.service';

function withLoading<T>(
  spinner: NgxSpinnerService,
  toastr: ToastrService
): OperatorFunction<T, T> {
  return (source$) =>
    source$.pipe(
      tap(() => spinner.show()),
      finalize(() => spinner.hide()),
      catchError((err) => {
        toastr.error(err.message ?? 'Error inesperado', 'Error');
        return EMPTY;
      })
    );
}

@Component({
  selector: 'app-info-bono',
  templateUrl: './info-bono.component.html',
  styleUrls: ['./info-bono.component.css'],
})
export class InfoBonoComponent implements OnInit, OnDestroy {
  dirContratoAgente: string;
  infoCertificador: InfoContrato;
  bonoInfo:BonoCarbonoInfo
  private readonly destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<InfoBonoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly certificador: CertificadorContractService,
    private readonly spinner: NgxSpinnerService,
    private readonly toastr: ToastrService
  ) {
    this.dirContratoAgente = data.dirContratoAgente;
    this.bonoInfo= data.bonoInfo;
    debugger;
  }

  ngOnInit(): void {
    this.initStreams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initStreams(): void {
    from(this.certificador.loadBlockChainContractData(this.dirContratoAgente))
      .pipe(
        switchMap(() => this.certificador.getInfoContrato()),
        tap((data) => {
          this.infoCertificador = data;
        }),
        withLoading(this.spinner, this.toastr),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}
