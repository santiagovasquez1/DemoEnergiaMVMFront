import { Observable, Subscription, timer } from 'rxjs';
import { TableService } from './../../../services/shared/table-service.service';
import { InfoTx } from './../../../models/InfoTx';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-transacciones',
  templateUrl: './transacciones.component.html',
  styles: [
  ]
})
export class TransaccionesComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['Transaccion', 'Fecha', 'TipoEnergia', 'AgenteOrigen', 'AgenteDestino', 'CantidadEnergia']
  dataSource: MatTableDataSource<InfoTx>
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorAnterior: number = 0;
  contadorActual: number = 0;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  constructor(private bancoEnergia: BancoEnergiaService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private tableService: TableService) {
    this.dataSource = new MatTableDataSource();
    this.timer$ = timer(0, 1000);
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.bancoEnergia.loadBlockChainContractData();
      this.tableService.setPaginatorTable(this.paginator);
      this.timerSubscription = this.timer$.subscribe(() => {
        this.getTransactions();
      });
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  ngOnDestroy(): void {
    this.timerSubscription.unsubscribe();
  }

  getTransactions() {
    this.bancoEnergia.getInfoTxs().subscribe({
      next: (data) => {

        this.contadorActual = data.length;
        if(this.contadorActual !== this.contadorAnterior) {
          this.dataSource.data = data.reverse();
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.table.renderRows();
          this.contadorAnterior = this.contadorActual;
        }
      }, error: (error) => {
        this.toastr.error(error.message, 'Error');
      }
    })
  }
}
