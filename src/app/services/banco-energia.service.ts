import { InfoContrato } from 'src/app/models/infoContrato';
import { InfoInyeccionBanco, EstadoInyeccion } from './../models/infoInyeccionBanco';
import { InfoEnergia } from './../models/InfoEnergia';
import { Observable, catchError, throwError, from, map, of, switchMap, forkJoin } from 'rxjs';
import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { Web3ConnectService } from './web3-connect.service';
import { WinRefService } from './win-ref.service';
import bancoEnergia from '../../../buildTruffle/contracts/BancoEnergia.json';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { InfoTx } from '../models/InfoTx';
import moment from 'moment';
import { ProviderRpcError } from '../models/JsonrpcError';
import { GeneradorContractService } from './generador-contract.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class BancoEnergiaService {
  contract: Contract | undefined;
  account: any;
  adressContract: any;
  web3: Web3;
  constructor(private winRef: WinRefService, private web3ConnectService: Web3ConnectService, private toastr: ToastrService) { }

  async loadBlockChainContractData() {
    await this.web3ConnectService.loadWeb3();
    this.web3 = this.winRef.window.web3 as Web3;


    const networkId = await this.web3.eth.net.getId();
    const networkData = bancoEnergia.networks[networkId];
    if (networkData) {
      const abi = bancoEnergia.abi;
      this.adressContract = networkData.address;
      this.contract = new this.web3.eth.Contract(abi as unknown as AbiItem, this.adressContract);
      this.account = localStorage.getItem('account');
      localStorage.setItem('addressRegulador', this.adressContract);
    } else {
      window.alert('Esta aplicación no está disponible en este network.');
    }

  }

  getTiposEnergiasDisponibles(): Observable<InfoEnergia[]> {
    return from(this.contract.methods.getTiposEnergiasDisponibles().call({ from: this.account })).pipe(
      map((data: any) => {
        let tempArray = data.map((infoEnergia) => {
          const [nombre, cantidadEnergia, precio] = infoEnergia;
          const tempEnergia: InfoEnergia = {
            nombre,
            cantidadEnergia,
            precio
          }
          return tempEnergia;
        })
        return tempArray as InfoEnergia[];
      }),
      catchError((error) => {

        return throwError(() => new Error(error.message));
      }));
  }

  getInfoTxs(): Observable<InfoTx[]> {
    return from(this.contract.methods.getInfoTxs().call({ from: this.account })).pipe(
      map((data: any) => {
        let tempArray = data.map((infoTx) => {
          const [tipoTx, fechaTx, tipoEnergia, cantidadEnergia, agenteOrigen, nombreAgenteOrigen, agenteDestino, nombreAgenteDestino, index] = infoTx;
          const tempTx: InfoTx = {
            tipoTx: parseInt(tipoTx),
            fechaTx: moment(parseInt(fechaTx) * 1000).format('DD/MM/YYYY HH:mm:ss'),
            fechaTxNum: parseInt(fechaTx),
            tipoEnergia,
            cantidadEnergia: parseInt(cantidadEnergia),
            agenteOrigen,
            nombreAgenteOrigen,
            agenteDestino,
            nombreAgenteDestino,
            index
          }
          return tempTx;
        });
        return tempArray as InfoTx[];
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      }));
  }

  setPrecioVentaEnergia(precioEnergia: number): Observable<any> {
    return from(this.contract?.methods.setPrecioVentaEnergia(precioEnergia).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getPrecioVentaEnergia(): Observable<number> {
    return from(this.contract.methods.getPrecioVentaEnergia().call({ from: this.account })).pipe(
      map(data => data as number),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getInfoInyeccionesEnergias(): Observable<InfoInyeccionBanco[]> {
    return from(this.contract?.methods.getInfoInyeccionesEnergias().call({ from: this.account })).pipe(
      switchMap((data: any[]) => {
        let mappingsInfoInyeccionBanco: Observable<InfoInyeccionBanco>[] = [];
        data.forEach(item => {
          mappingsInfoInyeccionBanco.push(this.mappingInfoInyeccionBanco(item));
        });
        return forkJoin(mappingsInfoInyeccionBanco);
      }),
      catchError((error: ProviderRpcError) => {
        return throwError(() => new Error(error.message));
      })
    )
  }

  liquidarInyecciones(timeStamp: number): Observable<any> {
    return from(this.contract?.methods.liquidarInyecciones(timeStamp).send({ from: this.account })).pipe(
      catchError((error: ProviderRpcError) => {
        return throwError(() => new Error(error.message));
      })
    )
  }

  private mappingInfoInyeccionBanco(data: any[]): Observable<InfoInyeccionBanco> {
    const generadorContract: GeneradorContractService = new GeneradorContractService(this.winRef, this.web3ConnectService, this.toastr);

    const [infoEnergiaTemp, infoPlantaTemp, dirContratoGenerador,
      ownerGenerador, precioEnergia, fechaInyeccion, estadoInyeccion] = data;

    const [nombreEnergia, cantidadEnergia] = infoEnergiaTemp;
    const [dirPlanta, nombrePlanta, departamento, ciudad, coordenadas,
      fechaInicio, tasaEmision, isRec, capacidadNominal, tecnologia, cantidadEnergiaPlanta, estado] = infoPlantaTemp;

    return from(generadorContract?.loadBlockChainContractData(dirContratoGenerador)).pipe(
      switchMap(() => {
        return generadorContract.getInfoContrato().pipe(
          switchMap((infoContrato: InfoContrato) => {
            const infoInyeccionBanco: InfoInyeccionBanco = {
              infoEnergia: {
                nombre: nombreEnergia,
                cantidadEnergia: parseInt(cantidadEnergia),
                precio: 0
              },
              infoPlanta: {
                dirPlanta,
                nombre: nombrePlanta,
                departamento,
                ciudad,
                coordenadas,
                fechaInicio,
                tasaEmision,
                isRec,
                capacidadNominal,
                tecnologia,
                cantidadEnergia: cantidadEnergiaPlanta,
                estado
              },
              dirContratoGenerador,
              ownerGenerador,
              nombreGenerador: infoContrato.empresa,
              precioEnergia: parseInt(precioEnergia),
              fechaInyeccion: moment(parseInt(fechaInyeccion) * 1000).format('DD/MM/YYYY HH:mm:ss'),
              estadoInyeccion: parseInt(estadoInyeccion) as EstadoInyeccion
            }
            return of(infoInyeccionBanco)
          })
        )
      })
    );
  }
}
