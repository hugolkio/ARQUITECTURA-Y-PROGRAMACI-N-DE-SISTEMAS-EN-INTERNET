import type { Request, Response } from "express";
import { ObjectId, MongoServerError, type Collection, type Filter } from "mongodb";
import type { ClienteT } from "../models/clientes.model.js";
import { ESTADOS_CUENTA, TIPOS_CUENTA, type CuentaT, type EstadoCuentaT, type TipoCuentaT } from "../models/cuentas.model.js";
import { TIPOS_MOVIMIENTO, type MovimientoT, type TipoMovimientoT } from "../models/movimientos.model.js";
import { generarIban } from "../utils/iban.js";
import { LIMITE_DIARIO, retiradoHoy } from "../utils/operaciones.js";
import { leerPaginacion, respuestaPaginada } from "../utils/paginacion.js";
import { esObjectIdValido, leerOperacion } from "../utils/validaciones.js";


let clientesCollection:Collection<ClienteT>;
let cuentasCollection:Collection<CuentaT>;
let movimientosCollection:Collection<MovimientoT>;

const MAX_CUENTAS_ABIERTAS = 3;

const DESCUBIERTO: Record<TipoCuentaT, number> = {
    corriente: 50000,
    ahorro: 0
};

const TRANSICIONES: Record<EstadoCuentaT, EstadoCuentaT[]> = {
    activa: ["bloqueada", "cerrada"],
    bloqueada: ["activa", "cerrada"],
    cerrada: []
};

const esTipoCuenta = (valor: unknown): valor is TipoCuentaT => (TIPOS_CUENTA as readonly unknown[]).includes(valor);
const esEstadoCuenta = (valor: unknown): valor is EstadoCuentaT => (ESTADOS_CUENTA as readonly unknown[]).includes(valor);


export const configCuentasCollection = (
    clientes: Collection<ClienteT>,
    cuentas: Collection<CuentaT>,
    movimientos: Collection<MovimientoT>
) =>{
    clientesCollection = clientes
    cuentasCollection = cuentas
    movimientosCollection = movimientos
}


export const createCuenta = async (
    req: Request,
    res: Response
)=>{
    const { clienteId, tipo } = req.body ?? {};

    if(typeof clienteId !== "string" || !esObjectIdValido(clienteId)){
        res.status(400).json({
            error: "El clienteId no es un ObjectId válido"
        })
        return
    }

    if(!esTipoCuenta(tipo)){
        res.status(400).json({
            error: "El tipo debe ser corriente o ahorro"
        })
        return
    }

    try {
        const cliente = await clientesCollection.findOne({ _id: new ObjectId(clienteId) });

        if(!cliente){
            res.status(404).json({
                error: "Cliente no encontrado"
            })
            return
        }

        const abiertas = await cuentasCollection.countDocuments({
            clienteId: cliente._id!,
            estado: { $ne: "cerrada" }
        });

        if(abiertas >= MAX_CUENTAS_ABIERTAS){
            res.status(409).json({
                error: `El cliente ya tiene ${MAX_CUENTAS_ABIERTAS} cuentas no cerradas`
            })
            return
        }

        // Si el IBAN generado colisiona con el índice único, se reintenta con otro
        for(let intento = 0; intento < 10; intento++){
            const newCuenta: CuentaT = {
                iban: generarIban(),
                clienteId: cliente._id!,
                tipo: tipo,
                saldo: 0,
                descubiertoMax: DESCUBIERTO[tipo],
                estado: "activa",
                creadaEn: new Date()
            };

            try {
                const result = await cuentasCollection.insertOne(newCuenta);

                res.status(201).json({
                    ...newCuenta,
                    _id: result.insertedId
                })
                return
            } catch (error) {
                if(error instanceof MongoServerError && error.code === 11000){
                    continue
                }
                throw error
            }
        }

        throw new Error("No se ha podido generar un IBAN único");
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Error al crear la cuenta"
        })
    }
}


export const getCuentas = async (
    req: Request,
    res: Response
) => {
    const paginacion = leerPaginacion(req.query);

    if(!paginacion){
        res.status(400).json({
            error: "Los parámetros pagina y limite deben ser enteros mayores que 0"
        })
        return
    }

    const filtro: Filter<CuentaT> = {};
    const { clienteId, tipo, estado } = req.query;

    if(clienteId !== undefined){
        if(typeof clienteId !== "string" || !esObjectIdValido(clienteId)){
            res.status(400).json({
                error: "El clienteId no es un ObjectId válido"
            })
            return
        }
        filtro.clienteId = new ObjectId(clienteId);
    }

    if(tipo !== undefined){
        if(!esTipoCuenta(tipo)){
            res.status(400).json({
                error: "El tipo debe ser corriente o ahorro"
            })
            return
        }
        filtro.tipo = tipo;
    }

    if(estado !== undefined){
        if(!esEstadoCuenta(estado)){
            res.status(400).json({
                error: "El estado debe ser activa, bloqueada o cerrada"
            })
            return
        }
        filtro.estado = estado;
    }

    try {
        const [cuentas, total] = await Promise.all([
            cuentasCollection.find(filtro).sort({ _id: 1 }).skip((paginacion.pagina - 1) * paginacion.limite).limit(paginacion.limite).toArray(),
            cuentasCollection.countDocuments(filtro)
        ]);

        res.json(respuestaPaginada(cuentas, total, paginacion));
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Error al obtener las cuentas"
        })
    }
}


export const getCuentaWithID = async (
    req: Request,
    res: Response
)=>{
    const id = String(req.params.id);

    if(!esObjectIdValido(id)){
        res.status(400).json({
            error: "Invalid ID"
        })
        return
    }

    try {
        const cuenta = await cuentasCollection.findOne({ _id: new ObjectId(id) });

        if(!cuenta){
            res.status(404).json({
                error: "Cuenta no encontrada"
            })
            return
        }

        const cliente = await clientesCollection.findOne({ _id: cuenta.clienteId });

        res.json({
            ...cuenta,
            titular: cliente ? { nombre: cliente.nombre, email: cliente.email } : null
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Error al buscar la cuenta"
        })
    }
}


export const changeEstadoCuenta = async (
    req: Request,
    res: Response
)=>{
    const id = String(req.params.id);

    if(!esObjectIdValido(id)){
        res.status(400).json({
            error: "Invalid ID"
        })
        return
    }

    const solicitado = req.body?.estado;

    if(!esEstadoCuenta(solicitado)){
        res.status(400).json({
            error: `Estado inexistente: ${JSON.stringify(solicitado)}. Los estados son activa, bloqueada o cerrada`
        })
        return
    }

    try {
        const cuenta = await cuentasCollection.findOne({ _id: new ObjectId(id) });

        if(!cuenta){
            res.status(404).json({
                error: "Cuenta no encontrada"
            })
            return
        }

        if(!TRANSICIONES[cuenta.estado].includes(solicitado)){
            res.status(409).json({
                error: `Transición no permitida: la cuenta está ${cuenta.estado} y se solicita ${solicitado}`
            })
            return
        }

        if(solicitado === "cerrada" && cuenta.saldo !== 0){
            res.status(409).json({
                error: `No se puede cerrar una cuenta con saldo distinto de 0 (saldo actual: ${cuenta.saldo})`
            })
            return
        }

        // El filtro evita pisar un cambio de estado o de saldo hecho mientras tanto
        const filtro: Filter<CuentaT> = { _id: cuenta._id!, estado: cuenta.estado };

        if(solicitado === "cerrada"){
            filtro.saldo = 0;
        }

        const actualizada = await cuentasCollection.findOneAndUpdate(
            filtro,
            { $set: { estado: solicitado } },
            { returnDocument: "after" }
        );

        if(!actualizada){
            res.status(409).json({
                error: "La cuenta ha cambiado mientras se procesaba la petición, inténtalo de nuevo"
            })
            return
        }

        res.json(actualizada);
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Error al cambiar el estado de la cuenta"
        })
    }
}


// Convierte "2026-10-31" en una fecha UTC. Si es el "hasta" se usa el inicio del día siguiente (exclusivo)
// para que incluya todo ese día. También se admite una fecha ISO completa.
const leerFecha = (valor: string, esHasta: boolean): { fecha: Date, exclusiva: boolean } | null => {
    if(/^\d{4}-\d{2}-\d{2}$/.test(valor)){
        const fecha = new Date(valor + "T00:00:00.000Z");

        if(isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor){
            return null;
        }

        if(esHasta){
            fecha.setUTCDate(fecha.getUTCDate() + 1);
        }

        return { fecha, exclusiva: esHasta };
    }

    const fecha = new Date(valor);

    return isNaN(fecha.getTime()) ? null : { fecha, exclusiva: false };
}


export const getMovimientos = async (
    req: Request,
    res: Response
)=>{
    const id = String(req.params.id);

    if(!esObjectIdValido(id)){
        res.status(400).json({
            error: "Invalid ID"
        })
        return
    }

    const paginacion = leerPaginacion(req.query);

    if(!paginacion){
        res.status(400).json({
            error: "Los parámetros pagina y limite deben ser enteros mayores que 0"
        })
        return
    }

    const { tipo, categoria, desde, hasta, orden } = req.query;

    // Todos son opcionales, pero si vienen tienen que ser un texto
    for(const [nombre, valor] of Object.entries({ tipo, categoria, desde, hasta, orden })){
        if(valor !== undefined && (typeof valor !== "string" || valor.trim() === "")){
            res.status(400).json({
                error: `El parámetro ${nombre} no es válido`
            })
            return
        }
    }

    try {
        const cuenta = await cuentasCollection.findOne({ _id: new ObjectId(id) });

        if(!cuenta){
            res.status(404).json({
                error: "Cuenta no encontrada"
            })
            return
        }

        const filtro: Filter<MovimientoT> = { cuentaId: cuenta._id! };

        if(typeof tipo === "string"){
            const tipos = tipo.split(",").map((t) => t.trim());
            const invalido = tipos.find((t) => !(TIPOS_MOVIMIENTO as readonly string[]).includes(t));

            if(invalido !== undefined){
                res.status(400).json({
                    error: `Tipo de movimiento no válido: "${invalido}". Los tipos son ${TIPOS_MOVIMIENTO.join(", ")}`
                })
                return
            }

            filtro.tipo = { $in: tipos as TipoMovimientoT[] };
        }

        if(typeof categoria === "string"){
            filtro.categoria = categoria.trim();
        }

        const desdeLeido = typeof desde === "string" ? leerFecha(desde.trim(), false) : undefined;
        const hastaLeido = typeof hasta === "string" ? leerFecha(hasta.trim(), true) : undefined;

        if(desdeLeido === null || hastaLeido === null){
            res.status(400).json({
                error: "Las fechas desde y hasta no son válidas (formato AAAA-MM-DD)"
            })
            return
        }

        if(desdeLeido || hastaLeido){
            const rango: { $gte?: Date, $lt?: Date, $lte?: Date } = {};

            if(desdeLeido){
                rango.$gte = desdeLeido.fecha;
            }

            if(hastaLeido){
                if(hastaLeido.exclusiva){
                    rango.$lt = hastaLeido.fecha;
                } else {
                    rango.$lte = hastaLeido.fecha;
                }
            }

            filtro.fecha = rango;
        }

        // Por defecto, los más recientes primero
        if(orden !== undefined && orden !== "fecha" && orden !== "-fecha"){
            res.status(400).json({
                error: "El parámetro orden debe ser fecha o -fecha"
            })
            return
        }

        const direccion = orden === "fecha" ? 1 : -1;

        const [movimientos, total] = await Promise.all([
            movimientosCollection.find(filtro).sort({ fecha: direccion, _id: direccion }).skip((paginacion.pagina - 1) * paginacion.limite).limit(paginacion.limite).toArray(),
            movimientosCollection.countDocuments(filtro)
        ]);

        res.json(respuestaPaginada(movimientos, total, paginacion));
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Error al obtener el extracto"
        })
    }
}


export const createIngreso = async (
    req: Request,
    res: Response
)=>{
    const id = String(req.params.id);

    if(!esObjectIdValido(id)){
        res.status(400).json({
            error: "Invalid ID"
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
        const cuenta = await cuentasCollection.findOne({ _id: new ObjectId(id) });

        if(!cuenta){
            res.status(404).json({
                error: "Cuenta no encontrada"
            })
            return
        }

        if(cuenta.estado === "cerrada"){
            res.status(409).json({
                error: "La cuenta está cerrada y no admite operaciones"
            })
            return
        }

        const actualizada = await cuentasCollection.findOneAndUpdate(
            { _id: cuenta._id!, estado: { $ne: "cerrada" } },
            { $inc: { saldo: operacion.importe } },
            { returnDocument: "after" }
        );

        if(!actualizada){
            res.status(409).json({
                error: "La cuenta ha cambiado mientras se procesaba la petición, inténtalo de nuevo"
            })
            return
        }

        const movimiento: MovimientoT = {
            cuentaId: cuenta._id!,
            tipo: "ingreso",
            importe: operacion.importe,
            saldoResultante: actualizada.saldo,
            concepto: operacion.concepto,
            categoria: operacion.categoria,
            fecha: new Date()
        };

        await movimientosCollection.insertOne(movimiento);

        res.status(201).json(movimiento)
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Error al realizar el ingreso"
        })
    }
}


export const createRetirada = async (
    req: Request,
    res: Response
)=>{
    const id = String(req.params.id);

    if(!esObjectIdValido(id)){
        res.status(400).json({
            error: "Invalid ID"
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
        const cuenta = await cuentasCollection.findOne({ _id: new ObjectId(id) });

        if(!cuenta){
            res.status(404).json({
                error: "Cuenta no encontrada"
            })
            return
        }

        if(cuenta.estado === "cerrada"){
            res.status(409).json({
                error: "La cuenta está cerrada y no admite operaciones"
            })
            return
        }

        if(cuenta.estado === "bloqueada"){
            res.status(409).json({
                error: "La cuenta está bloqueada y no admite retiradas"
            })
            return
        }

        const disponible = cuenta.saldo + cuenta.descubiertoMax;

        if(operacion.importe > disponible){
            res.status(409).json({
                error: `Saldo insuficiente: disponible ${disponible} céntimos (incluido descubierto), solicitado ${operacion.importe}`
            })
            return
        }

        const retirado = await retiradoHoy(movimientosCollection, cuenta._id!);

        if(retirado + operacion.importe > LIMITE_DIARIO){
            res.status(409).json({
                error: `Límite diario superado: hoy se han retirado ${retirado} céntimos, se solicitan ${operacion.importe} y el límite es ${LIMITE_DIARIO}`
            })
            return
        }

        // El filtro garantiza que el saldo no baje del descubierto aunque haya otra operación a la vez
        const actualizada = await cuentasCollection.findOneAndUpdate(
            {
                _id: cuenta._id!,
                estado: "activa",
                saldo: { $gte: operacion.importe - cuenta.descubiertoMax }
            },
            { $inc: { saldo: -operacion.importe } },
            { returnDocument: "after" }
        );

        if(!actualizada){
            res.status(409).json({
                error: "La cuenta ha cambiado mientras se procesaba la petición, inténtalo de nuevo"
            })
            return
        }

        const movimiento: MovimientoT = {
            cuentaId: cuenta._id!,
            tipo: "retirada",
            importe: -operacion.importe,
            saldoResultante: actualizada.saldo,
            concepto: operacion.concepto,
            categoria: operacion.categoria,
            fecha: new Date()
        };

        await movimientosCollection.insertOne(movimiento);

        res.status(201).json(movimiento)
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Error al realizar la retirada"
        })
    }
}
