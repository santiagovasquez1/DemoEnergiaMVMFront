export interface CompraEnergiaRequest {
    dirContratoGenerador: string;
    ownerCliente: string;
    cantidadEnergia: number;
    tipoEnergia: string;
    index:number;
}