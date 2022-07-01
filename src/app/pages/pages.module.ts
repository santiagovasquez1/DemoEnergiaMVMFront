
import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AgregarGeneradorComponent } from './dashboard/agregar-generador/agregar-generador.component';
import { AppRoutingModule } from '../app-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
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
import { GeneradorFactoryService } from '../services/generador-factory.service';




@NgModule({
  declarations: [
    DashboardComponent,
    AgregarGeneradorComponent,
    VerGeneradoresComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    AngularMaterialModule,
    FlexModule,
    ToastrModule.forRoot(),
    BrowserAnimationsModule,


  ],
  entryComponents: [GenerarEnergiaComponent],
  providers: [WinRefService, Web3ConnectService],
  exports: [
    DashboardComponent
  ]
})
export class PagesModule { }
