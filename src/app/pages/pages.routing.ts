import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgregarGeneradorComponent } from './dashboard/agregar-generador/agregar-generador.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VerGeneradoresComponent } from './dashboard/ver-generadores/ver-generadores.component';


const routes:Routes =[
    {
        path:"dashboard",component:DashboardComponent,children:[
            {path:"agregarGenerador", component:AgregarGeneradorComponent},
            {path:"verGeneradores", component:VerGeneradoresComponent}
        ]
    }
]
@NgModule({
    imports:[RouterModule.forChild(routes)],
    exports:[RouterModule]
})
export class PagesRoutingModule{}