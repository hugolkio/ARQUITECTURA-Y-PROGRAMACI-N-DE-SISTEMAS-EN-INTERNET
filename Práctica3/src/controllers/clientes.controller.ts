import type { Request, Response } from "express";
import { ObjectId, MongoServerError, type Collection } from "mongodb";
import type { ClienteT } from "../models/clientes.model.js";
import { esObjectIdValido } from "../utils/validaciones.js";
import { leerPaginacion, respuestaPaginada } from "../utils/paginacion.js";


let clientesCollection:Collection<ClienteT>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DNI_REGEX = /^\d{8}[A-Za-z]$/;


export const configClientesCollection = (collection: Collection<ClienteT>) =>{
    clientesCollection = collection
}


export const getClientes = async (
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

    try {
        const [clientes, total] = await Promise.all([
            clientesCollection.find().sort({ _id: 1 }).skip((paginacion.pagina - 1) * paginacion.limite).limit(paginacion.limite).toArray(),
            clientesCollection.countDocuments()
        ]);

        res.json(respuestaPaginada(clientes, total, paginacion));
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Error al obtener los clientes"
        })
    }
}


export const getClienteWithID = async (
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
        const cliente = await clientesCollection.findOne({
            _id: new ObjectId(id)
        });

        if(!cliente){
            res.status(404).json({
                error: "Cliente no encontrado"
            })
            return;
        }

        res.json(cliente);
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Error al buscar el cliente"
        })
    }
}


export const createCliente = async (
    req: Request,
    res: Response
)=>{
    const { nombre, email, dni } = req.body ?? {};

    if(typeof nombre !== "string" || nombre.trim() === ""){
        res.status(400).json({
            error: "El nombre es obligatorio"
        })
        return
    }

    if(typeof email !== "string" || !EMAIL_REGEX.test(email.trim())){
        res.status(400).json({
            error: "El email es obligatorio y debe tener un formato válido"
        })
        return
    }

    if(typeof dni !== "string" || !DNI_REGEX.test(dni.trim())){
        res.status(400).json({
            error: "El dni es obligatorio y debe tener 8 dígitos y una letra"
        })
        return
    }

    const newCliente: ClienteT = {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        dni: dni.trim().toUpperCase(),
        creadoEn: new Date()
    };

    try {
        // La unicidad de email y dni la garantiza el índice único
        const result = await clientesCollection.insertOne(newCliente);

        res.status(201).json({
            ...newCliente,
            _id: result.insertedId
        })
    } catch (error) {
        if(error instanceof MongoServerError && error.code === 11000){
            const campo = error.keyPattern?.email ? "email" : "dni";

            res.status(409).json({
                error: `Ya existe un cliente con ese ${campo}`
            })
            return
        }

        console.log(error)
        res.status(500).json({
            error: "Error al crear el cliente"
        })
    }
}


export const changeCliente = async (
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

    const { nombre, email, dni } = req.body ?? {};

    if(dni !== undefined){
        res.status(400).json({
            error: "El dni no se puede modificar"
        })
        return
    }

    const cambios: Partial<Pick<ClienteT, "nombre" | "email">> = {};

    if(nombre !== undefined){
        if(typeof nombre !== "string" || nombre.trim() === ""){
            res.status(400).json({
                error: "El nombre no puede estar vacío"
            })
            return
        }
        cambios.nombre = nombre.trim();
    }

    if(email !== undefined){
        if(typeof email !== "string" || !EMAIL_REGEX.test(email.trim())){
            res.status(400).json({
                error: "El email no tiene un formato válido"
            })
            return
        }
        cambios.email = email.trim().toLowerCase();
    }

    if(Object.keys(cambios).length === 0){
        res.status(400).json({
            error: "Hay que indicar el nombre o el email a modificar"
        })
        return
    }

    try {
        const actualizado = await clientesCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: cambios },
            { returnDocument: "after" }
        );

        if(!actualizado){
            res.status(404).json({
                error: "Cliente no encontrado"
            })
            return
        }

        res.json(actualizado);
    } catch (error) {
        if(error instanceof MongoServerError && error.code === 11000){
            res.status(409).json({
                error: "Ya existe un cliente con ese email"
            })
            return
        }

        console.log(error)
        res.status(500).json({
            error: "Error al modificar el cliente"
        })
    }
}
