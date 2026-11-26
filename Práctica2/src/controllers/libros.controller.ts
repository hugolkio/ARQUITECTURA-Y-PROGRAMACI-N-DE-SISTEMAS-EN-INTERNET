import type { Request, Response } from "express";
import { changeLibros, libros } from "../data/libros.data.js";
import type { LibroT } from "../models/libros.model.js";


const findLibro = (id: number, res: Response) => { //busca un libro por id, recorre la lista y devuelve el primer libro cuyo id coincide

    const libro = libros.find(x => x.id === id);

    if (!libro) {
        res.status(404).json({
            message: `No existe un libro con id ${id}`
        })
        return
    }

    return libro;
}

const existeDuplicado = (titulo: string, autor: string, ignorarId?: number) => {
    return libros.some(x =>
        x.id !== ignorarId &&
        x.titulo.trim().toLowerCase() === titulo.trim().toLowerCase() &&
        x.autor.trim().toLowerCase() === autor.trim().toLowerCase()
    )
}


export const getLibros = (
    req: Request,
    res: Response
) => {
    res.json(libros); //responde con la lista completa en JSON
}

export const getLibroWithID = (
    req: Request,
    res: Response
) => {
    const id = Number(req.params.id);

    const libro = findLibro(id, res);

    if (libro) {
        res.json(libro); //aquí simplemente no se hace nada más, si existe, se envía.
    }
}

export const createLibro = (
    req: Request,
    res: Response
) => {
    if (!req.body) {
        res.status(400).json({
            message: "Este endpoint necesita un body"
        })
        return
    }

    const { titulo, autor, año } = req.body;

    if (!titulo || !autor || año === undefined) {
        res.status(400).json({
            message: "Los campos titulo, autor y año son obligatorios"
        })
        return
    }

    if (!Number.isInteger(año)) {
        res.status(400).json({
            message: "El año debe ser un número entero"
        })
        return
    }

    if (existeDuplicado(titulo, autor)) {
        res.status(409).json({
            message: "Ya existe un libro con el mismo título y autor"
        })
        return
    }

    const nuevoLibro: LibroT = {
        id: libros.length > 0 ? Math.max(...libros.map(x => x.id)) + 1 : 1,
        titulo: titulo.trim(),
        autor: autor.trim(),
        año,
        disponible: true
    }

    libros.push(nuevoLibro);

    res.status(201).json(nuevoLibro);
}

export const replaceLibro = (
    req: Request,
    res: Response
) => {
    const id = Number(req.params.id);

    if (!req.body) {
        res.status(400).json({
            message: "Este endpoint necesita un body"
        })
        return
    }

    const libro = findLibro(id, res);

    if (!libro) return;

    const { titulo, autor, año } = req.body;

    if (!titulo || !autor || año === undefined) {
        res.status(400).json({
            message: "PUT requiere los campos titulo, autor y año"
        })
        return
    }

    if (!Number.isInteger(año)) {
        res.status(400).json({
            message: "El año debe ser un número entero"
        })
        return
    }

    if (existeDuplicado(titulo, autor, id)) {
        res.status(409).json({
            message: "Ya existe otro libro con el mismo título y autor"
        })
        return
    }

    // "disponible" lo gestionan /prestar y /devolver, así que se mantiene
    const libroActualizado: LibroT = {
        id,
        titulo: titulo.trim(),
        autor: autor.trim(),
        año,
        disponible: libro.disponible
    }

    changeLibros(libros.map(x => x.id === id ? libroActualizado : x));

    res.json({
        message: "Libro reemplazado",
        libro: libroActualizado
    })
}

export const changeLibro = (
    req: Request,
    res: Response
) => {
    const id = Number(req.params.id);

    if (!req.body) {
        res.status(400).json({
            message: "Este endpoint necesita un body"
        })
        return
    }

    const libro = findLibro(id, res);

    if (!libro) return;

    const { titulo, autor, año } = req.body;

    if (titulo === undefined && autor === undefined && año === undefined) {
        res.status(400).json({
            message: "Debes enviar al menos un campo: titulo, autor o año"
        })
        return
    }

    if (año !== undefined && !Number.isInteger(año)) {
        res.status(400).json({
            message: "El año debe ser un número entero"
        })
        return
    }

    const nuevoTitulo = titulo !== undefined ? String(titulo).trim() : libro.titulo;
    const nuevoAutor = autor !== undefined ? String(autor).trim() : libro.autor;

    if (!nuevoTitulo || !nuevoAutor) {
        res.status(400).json({
            message: "El titulo y el autor no pueden estar vacíos"
        })
        return
    }

    if (existeDuplicado(nuevoTitulo, nuevoAutor, id)) {
        res.status(409).json({
            message: "Ya existe otro libro con el mismo título y autor"
        })
        return
    }

    const libroActualizado: LibroT = {
        ...libro,
        titulo: nuevoTitulo,
        autor: nuevoAutor,
        año: año !== undefined ? año : libro.año
    }

    changeLibros(libros.map(x => x.id === id ? libroActualizado : x));

    res.json({
        message: "Libro actualizado",
        libro: libroActualizado
    })
}

export const deleteLibro = (
    req: Request,
    res: Response
) => {
    const id = Number(req.params.id);

    const libro = findLibro(id, res);

    if (!libro) return;

    if (!libro.disponible) {
        res.status(409).json({
            message: "No se puede borrar un libro que está prestado"
        })
        return
    }

    changeLibros(libros.filter(x => x.id !== id));

    res.json({
        message: "Libro eliminado"
    })
}
