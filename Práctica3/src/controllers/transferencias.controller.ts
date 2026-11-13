import type { Request, Response } from "express";
import { ObjectId, type Collection } from "mongodb";
import type { CuentaT } from "../models/cuentas.model.js";
import type { MovimientoT } from "../models/movimientos.model.js";
import { esIbanValido } from "../utils/iban.js";
import { LIMITE_DIARIO, calcularComision, retiradoHoy } from "../utils/operaciones.js";
import { leerOperacion } from "../utils/validaciones.js";


let cuentasCollection:Collection<CuentaT>;
let movimientosCollection:Collection<MovimientoT>;


export const configTransferenciasCollection = (
    cuentas: Collection<CuentaT>,
    movimientos: Collection<MovimientoT>
) =>{
    cuentasCollection = cuentas
    movimientosCollection = movimientos
}


export const createTransferencia = async (
    req: Request,
    res: Response
)=>{
    const ibanOrigen = req.body?.ibanOrigen;
    const ibanDestino = req.body?.ibanDestino;

    if(typeof ibanOrigen !== "string" || !esIbanValido(ibanOrigen)){
        res.status(400).json({
            error: "El IBAN de origen no es válido"
        })
        return
    }

    if(typeof ibanDestino !== "string" || !esIbanValido(ibanDestino)){
        res.status(400).json({
            error: "El IBAN de destino no es válido"
        })
        return
    }

    if(ibanOrigen === ibanDestino){
        res.status(400).json({
            error: "El IBAN de origen y el de destino deben ser distintos"
        })
        return
    }

    const operacion = leerOperacion(req.body);

    if(typeof operacion === "string"){
        res.status(400).json({
            error: operacion
        })
        return
    }

    try {
        const origen = await cuentasCollection.findOne({ iban: ibanOrigen });

        if(!origen){
            res.status(404).json({
                error: "La cuenta de origen no existe"
            })
            return
        }

        const destino = await cuentasCollection.findOne({ iban: ibanDestino });

        if(!destino){
            res.status(404).json({
                error: "La cuenta de destino no existe"
            })
            return
        }

        if(origen.estado !== "activa"){
            res.status(409).json({
                error: `La cuenta de origen debe estar activa (estado actual: ${origen.estado})`
            })
            return
        }

        if(destino.estado === "cerrada"){
            res.status(409).json({
                error: "La cuenta de destino está cerrada y no admite operaciones"
            })
            return
        }

        const comision = calcularComision(operacion.importe, origen.clienteId.equals(destino.clienteId));
        const total = operacion.importe + comision;
        const disponible = origen.saldo + origen.descubiertoMax;

        if(total > disponible){
            res.status(409).json({
                error: `Saldo insuficiente: disponible ${disponible} céntimos (incluido descubierto), solicitado ${total} (importe ${operacion.importe} + comisión ${comision})`
            })
            return
        }

        const retirado = await retiradoHoy(movimientosCollection, origen._id!);

        if(retirado + operacion.importe > LIMITE_DIARIO){
            res.status(409).json({
                error: `Límite diario superado: hoy se han retirado ${retirado} céntimos, se solicitan ${operacion.importe} y el límite es ${LIMITE_DIARIO}`
            })
            return
        }

        // Se descuenta del origen (importe + comisión) con el mismo control de saldo que una retirada
        const origenActualizado = await cuentasCollection.findOneAndUpdate(
            {
                _id: origen._id!,
                estado: "activa",
                saldo: { $gte: total - origen.descubiertoMax }
            },
            { $inc: { saldo: -total } },
            { returnDocument: "after" }
        );

        if(!origenActualizado){
            res.status(409).json({
                error: "La cuenta de origen ha cambiado mientras se procesaba la petición, inténtalo de nuevo"
            })
            return
        }

        const destinoActualizado = await cuentasCollection.findOneAndUpdate(
            { _id: destino._id!, estado: { $in: ["activa", "bloqueada"] } },
            { $inc: { saldo: operacion.importe } },
            { returnDocument: "after" }
        );

        if(!destinoActualizado){
            // Se devuelve al origen lo que se le había descontado
            await cuentasCollection.updateOne({ _id: origen._id! }, { $inc: { saldo: total } });

            res.status(409).json({
                error: "La cuenta de destino ha cambiado mientras se procesaba la petición, inténtalo de nuevo"
            })
            return
        }

        const transferenciaId = new ObjectId();
        const fecha = new Date();

        const movimientos: MovimientoT[] = [
            {
                cuentaId: origen._id!,
                tipo: "transferencia_emitida",
                importe: -operacion.importe,
                saldoResultante: origenActualizado.saldo + comision,
                concepto: operacion.concepto,
                categoria: operacion.categoria,
                transferenciaId,
                fecha
            }
        ];

        if(comision > 0){
            movimientos.push({
                cuentaId: origen._id!,
                tipo: "comision",
                importe: -comision,
                saldoResultante: origenActualizado.saldo,
                concepto: `Comisión: ${operacion.concepto}`,
                categoria: "comisiones",
                transferenciaId,
                fecha
            });
        }

        movimientos.push({
            cuentaId: destino._id!,
            tipo: "transferencia_recibida",
            importe: operacion.importe,
            saldoResultante: destinoActualizado.saldo,
            concepto: operacion.concepto,
            categoria: operacion.categoria,
            transferenciaId,
            fecha
        });

        await movimientosCollection.insertMany(movimientos);

        res.status(201).json({
            transferenciaId,
            ibanOrigen,
            ibanDestino,
            importe: operacion.importe,
            comision,
            saldoOrigen: origenActualizado.saldo,
            concepto: operacion.concepto,
            categoria: operacion.categoria,
            fecha
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Error al realizar la transferencia"
        })
    }
}
