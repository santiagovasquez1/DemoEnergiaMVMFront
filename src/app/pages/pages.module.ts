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



@NgModule({
  declarations: [
    DashboardComponent,
    AgregarGeneradorComponent,
    VerGeneradoresComponent,
    ReguladorMercadoComponent,
    ClienteDashboardComponent,
    ComprarTokensComponent,
    ContratarComercializadorComponent
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
    ComprarTokensComponent
  ]
})
export class PagesModule { }
