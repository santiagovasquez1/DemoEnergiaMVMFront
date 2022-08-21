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
  private eventoTransacciones: any;
  dataSource: MatTableDataSource<InfoTx>
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  constructor(private bancoEnergia: BancoEnergiaService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private tableService: TableService) {
    this.dataSource = new MatTableDataSource();
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.bancoEnergia.loadBlockChainContractData();
      this.eventoTransacciones = this.bancoEnergia.contract.events.eventoTransaccion({
        fromBlock: 'latest'
      }).on('data', (event) => {        
        this.getTransactions();
      });
      this.getTransactions();
      this.tableService.setPaginatorTable(this.paginator);
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  ngOnDestroy(): void {
    this.eventoTransacciones.removeAllListeners('data');
  }

  getTransactions() {
    this.dataSource.data = [];
    this.bancoEnergia.getInfoTxs().subscribe({
      next: (data) => {
        this.dataSource.data = data.reverse();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();
      }, error: (error) => {
        this.toastr.error(error.message, 'Error');
      }
    })
  }
}
