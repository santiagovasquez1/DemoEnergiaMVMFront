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
<<<<<<< Updated upstream
=======
import { InfoCertificadoAgenteComponent } from './info-certificado-agente/info-certificado-agente.component';
import { InfoCertificadoCompraComponent } from './info-certificado-compra/info-certificado-compra.component';
>>>>>>> Stashed changes




@NgModule({
    declarations: [
        ToolbarComponent,
        AsideComponent,
        GenerarEnergiaComponent,
        LineChartComponent,
<<<<<<< Updated upstream
        PieChartComponent
=======
        PieChartComponent,
        InfoCertificadoAgenteComponent,
        InfoCertificadoCompraComponent
>>>>>>> Stashed changes
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
        NgChartsModule 
    ],
    exports: [
        ToolbarComponent,
        AsideComponent,
        GenerarEnergiaComponent,
        LineChartComponent,
<<<<<<< Updated upstream
        PieChartComponent
=======
        PieChartComponent,
        InfoCertificadoAgenteComponent,
        InfoCertificadoCompraComponent
>>>>>>> Stashed changes
    ]
})
export class SharedModule { }
