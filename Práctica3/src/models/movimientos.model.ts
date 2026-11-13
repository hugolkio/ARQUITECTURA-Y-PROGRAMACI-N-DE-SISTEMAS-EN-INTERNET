import type { ObjectId } from "mongodb"



export const TIPOS_MOVIMIENTO = ["ingreso", "retirada", "transferencia_emitida", "transferencia_recibida", "comision"] as const;

export type TipoMovimientoT = typeof TIPOS_MOVIMIENTO[number];

export type MovimientoT = {
    _id?: ObjectId,
    cuentaId: ObjectId,
    tipo: TipoMovimientoT,
    importe: number,
    saldoResultante: number,
    concepto: string,
    categoria: string,
    transferenciaId?: ObjectId,
    fecha: Date
}
