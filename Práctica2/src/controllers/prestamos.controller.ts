import type { Request, Response } from "express";
import { changeLibros, changePrestamos, libros, prestamos } from "../data/libros.data.js";
import type { LibroT, PrestamoT } from "../models/libros.model.js";

const MAX_PRESTAMOS_POR_USUARIO = 2;


const findLibro = (id: number, res: Response) => {

    const libro = libros.find(x => x.id === id);

    if (!libro) {
        res.status(404).json({
            message: `No existe un libro con id ${id}`
        })
        return
    }

    return libro;
}

const hoy = () => new Date().toISOString().slice(0, 10);


export const getPrestamos = (
    req: Request,
    res: Response
) => {
    res.json(prestamos);
}

export const getHistorialLibro = (
    req: Request,
    res: Response
) => {
    const id = Number(req.params.id);

    const libro = findLibro(id, res);

    if (libro) {
        res.json(prestamos.filter(x => x.libroId === id));
    }
}

export const prestarLibro = (
    req: Request,
    res: Response
) => {
    const id = Number(req.params.id);

    const libro = findLibro(id, res);

    if (!libro) return;

    const usuario = req.body?.usuario;

    if (typeof usuario !== "string" || usuario.trim() === "") {
        res.status(400).json({
            message: "El campo usuario es obligatorio y debe ser un texto no vacío"
        })
        return
    }

    if (!libro.disponible) {
        res.status(409).json({
            message: "El libro ya está prestado"
        })
        return
    }

    const nombre = usuario.trim();

    const activos = prestamos.filter(x =>
        x.usuario.toLowerCase() === nombre.toLowerCase() &&
        x.fechaDevolucion === null
    ).length;

    if (activos >= MAX_PRESTAMOS_POR_USUARIO) {
        res.status(409).json({
            message: `${nombre} ya tiene ${MAX_PRESTAMOS_POR_USUARIO} libros prestados (límite alcanzado)`
        })
        return
    }

    const nuevoPrestamo: PrestamoT = {
        id: prestamos.length > 0 ? Math.max(...prestamos.map(x => x.id)) + 1 : 1,
        libroId: id,
        usuario: nombre,
        fechaPrestamo: hoy(),
        fechaDevolucion: null
    }

    const libroPrestado: LibroT = { ...libro, disponible: false };

    changePrestamos([...prestamos, nuevoPrestamo]);
    changeLibros(libros.map(x => x.id === id ? libroPrestado : x));

    res.status(201).json(nuevoPrestamo);
}

export const devolverLibro = (
    req: Request,
    res: Response
) => {
    const id = Number(req.params.id);

    const libro = findLibro(id, res);

    if (!libro) return;

    if (libro.disponible) {
        res.status(409).json({
            message: "El libro no está prestado, no se puede devolver"
        })
        return
    }

    const prestamo = prestamos.find(x => x.libroId === id && x.fechaDevolucion === null);

    if (!prestamo) {
        res.status(404).json({
            message: "No se encontró un préstamo activo para este libro"
        })
        return
    }

    const prestamoCerrado: PrestamoT = { ...prestamo, fechaDevolucion: hoy() };
    const libroDevuelto: LibroT = { ...libro, disponible: true };

    changePrestamos(prestamos.map(x => x.id === prestamo.id ? prestamoCerrado : x));
    changeLibros(libros.map(x => x.id === id ? libroDevuelto : x));

    res.json(prestamoCerrado);
}
