import { ClienteDashboardComponent } from './cliente/cliente-dashboard.component';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';
import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AgregarGeneradorComponent } from './dashboard/agregar-generador/agregar-generador.component';
import { AppRoutingModule } from '../app-routing.module';
import { ReactiveFormsModule,FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AngularMaterialModule } from '../anular-material.module';
import { FlexModule } from '@angular/flex-layout';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { VerGeneradoresComponent } from './dashboard/ver-generadores/ver-generadores.component';
import { GenerarEnergiaComponent } from '../shared/generar-energia/generar-energia.component';
import { WinRefService } from '../services/win-ref.service';
import { ReguladorMercadoService } from '../services/regulador-mercado.service';
import { ReguladorMercadoComponent } from './regulador-mercado/regulador-mercado.component';
import { ComprarTokensComponent } from './cliente/comprar-tokens/comprar-tokens.component';
import { ContratarComercializadorComponent } from './cliente/contratar-comercializador/contratar-comercializador.component';
import { ComprarEnergiaComponent } from './cliente/comprar-energia/comprar-energia.component';
import { ComercializadorComponent } from './comercializador/comercializador.component';
import { RegistrosComponent } from './regulador-mercado/registros/registros.component';
import { SolicitudesComponent } from './regulador-mercado/solicitudes/solicitudes.component';
import { InyectarTokensComponent } from './regulador-mercado/inyectar-tokens/inyectar-tokens.component';
import { ListaClientesComponent } from './comercializador/lista-clientes/lista-clientes.component';
import { DevolverTokensComponent } from './cliente/devolver-tokens/devolver-tokens.component';
import { BancoEnergiaComponent } from './banco-energia/banco-energia.component';
import { GeneradorComponent } from './generador/generador.component';
import { TodosGeneradoresComponent } from './generador/todos-generadores/todos-generadores.component';
import { EmisionesCompraComponent } from './comercializador/emisiones-compra/emisiones-compra.component';
import { DelegarTokensComponent } from './cliente/delegar-tokens/delegar-tokens.component';
import { NuevaEnergiaComponent } from './generador/nueva-energia/nueva-energia.component';
import { CompraEnergiaComponent } from './comercializador/compra-energia/compra-energia.component';

@NgModule({
  declarations: [
    DashboardComponent,
    AgregarGeneradorComponent,
    VerGeneradoresComponent,
    ReguladorMercadoComponent,
    ClienteDashboardComponent,
    ComprarTokensComponent,
    ContratarComercializadorComponent,
    ComprarEnergiaComponent,
    ComercializadorComponent,
    RegistrosComponent,
    SolicitudesComponent,
    InyectarTokensComponent,
    ListaClientesComponent,
    DevolverTokensComponent,
    BancoEnergiaComponent,
    GeneradorComponent,
    TodosGeneradoresComponent,
    EmisionesCompraComponent,
    DelegarTokensComponent,
    NuevaEnergiaComponent,
    CompraEnergiaComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    AngularMaterialModule,
    FlexModule,
    ToastrModule.forRoot(),
    BrowserAnimationsModule    
  ],
  entryComponents: [GenerarEnergiaComponent],
  providers: [WinRefService, Web3ConnectService],
  exports: [
    DashboardComponent,
    AgregarGeneradorComponent,
    VerGeneradoresComponent,
    ReguladorMercadoComponent,
    ClienteDashboardComponent,
    ComprarTokensComponent,
    ContratarComercializadorComponent,
    ComprarEnergiaComponent,
    ComercializadorComponent,
    RegistrosComponent,
    SolicitudesComponent,
    InyectarTokensComponent,
    ListaClientesComponent,
    DevolverTokensComponent,
    BancoEnergiaComponent,
    GeneradorComponent,
    TodosGeneradoresComponent,
    EmisionesCompraComponent,
    DelegarTokensComponent
  ]
})
export class PagesModule { }
