import type { Collection, ObjectId } from "mongodb";
import type { MovimientoT } from "../models/movimientos.model.js";



export const LIMITE_DIARIO = 100000;

// Gratis entre cuentas del mismo cliente. Si no, 0,5 % con mínimo de 100 céntimos redondeado hacia arriba.
// ceil(importe * 0,005) = ceil(importe / 200), calculado con enteros para no usar floats
export const calcularComision = (importe: number, mismoCliente: boolean): number => {
    if(mismoCliente){
        return 0;
    }

    return Math.max(100, Math.floor((importe + 199) / 200));
}

// Suma de lo retirado (retiradas y transferencias emitidas, sin comisiones) en el día natural (UTC)
export const retiradoHoy = (
    movimientosCollection: Collection<MovimientoT>,
    cuentaId: ObjectId
): Promise<number> => {
    const ahora = new Date();
    const inicio = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
    const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);

    return movimientosCollection.aggregate<{ total: number }>([
        {
            $match: {
                cuentaId: cuentaId,
                tipo: { $in: ["retirada", "transferencia_emitida"] },
                fecha: { $gte: inicio, $lt: fin }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: { $multiply: ["$importe", -1] } }
            }
        }
    ]).toArray().then((resultado) => {
        return resultado[0]?.total ?? 0;
    });
}
