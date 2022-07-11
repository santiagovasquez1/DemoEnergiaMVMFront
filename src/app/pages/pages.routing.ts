import { ReguladorMercadoComponent } from './regulador-mercado/regulador-mercado.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgregarGeneradorComponent } from './dashboard/agregar-generador/agregar-generador.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VerGeneradoresComponent } from './dashboard/ver-generadores/ver-generadores.component';
import { AuthGuard } from '../guards/auth.guard';


const routes: Routes = [
    {
        path: "dashboard",
        component: DashboardComponent,
        children: [
            {
                path: "",
                component:ReguladorMercadoComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "agregarGenerador",
                component: AgregarGeneradorComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "verGeneradores",
                component: VerGeneradoresComponent,
                canActivate: [AuthGuard]
            },
        ]
    }
]
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PagesRoutingModule { }