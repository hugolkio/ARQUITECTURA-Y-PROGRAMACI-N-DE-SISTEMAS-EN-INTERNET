import type { ObjectId } from "mongodb"



export const TIPOS_CUENTA = ["corriente", "ahorro"] as const;
export const ESTADOS_CUENTA = ["activa", "bloqueada", "cerrada"] as const;

export type TipoCuentaT = typeof TIPOS_CUENTA[number];
export type EstadoCuentaT = typeof ESTADOS_CUENTA[number];

export type CuentaT = {
    _id?: ObjectId,
    iban: string,
    clienteId: ObjectId,
    tipo: TipoCuentaT,
    saldo: number,
    descubiertoMax: number,
    estado: EstadoCuentaT,
    creadaEn: Date
}
