import { EmisionesCompraComponent } from './comercializador/emisiones-compra/emisiones-compra.component';
import { BancoEnergiaComponent } from './banco-energia/banco-energia.component';
import { SolicitudesComponent } from './regulador-mercado/solicitudes/solicitudes.component';
import { RegistrosComponent } from './regulador-mercado/registros/registros.component';
import { ComercializadorComponent } from './comercializador/comercializador.component';
import { ClienteDashboardComponent } from './cliente/cliente-dashboard.component';
import { ReguladorMercadoComponent } from './regulador-mercado/regulador-mercado.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgregarGeneradorComponent } from './dashboard/agregar-generador/agregar-generador.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VerGeneradoresComponent } from './dashboard/ver-generadores/ver-generadores.component';
import { AuthGuard } from '../guards/auth.guard';
import { ListaClientesComponent } from './comercializador/lista-clientes/lista-clientes.component';
import { GeneradorComponent } from './generador/generador.component';
import { TodosGeneradoresComponent } from './generador/todos-generadores/todos-generadores.component';
import { EthereumComponent } from './dashboard/ethereum/ethereum.component';


const routes: Routes = [
    {
        path: "dashboard",
        component: DashboardComponent,
        children: [
            {
                path: "",
                component: BancoEnergiaComponent
            },
            {
                path: "regulador-mercado",
                component: ReguladorMercadoComponent,
                canActivate: [AuthGuard],
            },
            {
                path: "regulador-mercado/solicitudes",
                component: SolicitudesComponent,
                canActivate: [AuthGuard],
            },
            {
                path: "regulador-mercado/registros",
                component: RegistrosComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "cliente",
                component: ClienteDashboardComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "comercializador",
                component: ComercializadorComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "comercializador/lista-clientes",
                component: ListaClientesComponent,
                canActivate: [AuthGuard]
            },
            {
                path:"comercializador/emisiones-de-compra",
                component: EmisionesCompraComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "generador",
                component: GeneradorComponent,
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
            {
                path: "todos-generadores",
                component: TodosGeneradoresComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "ethereum",
                component: EthereumComponent,
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
