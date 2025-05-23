import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from './../anular-material.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { AsideComponent } from './aside/aside.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { GenerarEnergiaComponent } from './generar-energia/generar-energia.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexModule } from '@angular/flex-layout';
import { LineChartComponent } from './charts/line-chart/line-chart.component';
import { PieChartComponent } from './charts/pie-chart/pie-chart.component';
import { NgChartsModule } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';
import { InfoCertificadoAgenteComponent } from './info-certificado-agente/info-certificado-agente.component';
import { TipoTransaccionPipe } from './pipes/tipo-transaccion.pipe';
import { TipoContratoPipe } from './pipes/tipo-contrato.pipe';
import { EstadoRegistroPipe } from './pipes/estado-registro.pipe';
import { LimitTextPipe } from './pipes/limit-text.pipe';
import { FilterComponent } from './filter/filter.component';
import { EstadoPlantaPipe } from './pipes/estado-planta.pipe';
import { EstadoCompraPipe } from './pipes/estado-compra.pipe';
import { InfoCertificadoCompraComponent } from './info-certificado-compra/info-certificado-compra.component';
import { EstadoInyeccionPipe } from './pipes/estado-inyeccion.pipe';

import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BonosCarbonoComponent } from '../pages/bonos-carbono/bonos-carbono.component';
import { InfoBonoComponent } from './info-bono/info-bono.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
    declarations: [
        ToolbarComponent,
        AsideComponent,
        GenerarEnergiaComponent,
        LineChartComponent,
        PieChartComponent,
        InfoCertificadoAgenteComponent,
        TipoTransaccionPipe,
        TipoContratoPipe,
        EstadoRegistroPipe,
        LimitTextPipe,
        FilterComponent,
        EstadoPlantaPipe,
        EstadoCompraPipe,
        InfoCertificadoCompraComponent,
        EstadoInyeccionPipe,
        BonosCarbonoComponent,
        InfoBonoComponent,
        
    ],
    imports: [
        CommonModule,
        AngularMaterialModule,
        MatButtonModule,
        MatMenuModule,
        BrowserModule,
        BrowserAnimationsModule,
        MatDialogModule,
        ReactiveFormsModule,
        FlexModule,
        RouterModule,
        NgChartsModule ,
        MatIconModule,
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: HttpLoaderFactory,
              deps: [HttpClient]
            }
          })
    ],
    exports: [
        ToolbarComponent,
        AsideComponent,
        GenerarEnergiaComponent,
        LineChartComponent,
        PieChartComponent,
        InfoCertificadoAgenteComponent,
        TipoTransaccionPipe,
        TipoContratoPipe,
        EstadoRegistroPipe,
        LimitTextPipe,
        FilterComponent,
        EstadoPlantaPipe,
        EstadoCompraPipe,
        InfoCertificadoCompraComponent,
        EstadoInyeccionPipe
    ]
})
export class SharedModule { }
