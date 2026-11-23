import type { Request, Response } from "express";
import db from "../data/db.js";
import type { Libro } from "../types/index.js";
import {
  error,
  esAñoValido,
  esTextoValido,
  leerAño,
  leerBody,
  libroCargado,
} from "../utils/helpers.js";

const existeDuplicado = (titulo: string, autor: string, ignorarId: number | null = null): boolean =>
  db.libros.some(
    (l) =>
      l.id !== ignorarId &&
      l.titulo.trim().toLowerCase() === titulo.trim().toLowerCase() &&
      l.autor.trim().toLowerCase() === autor.trim().toLowerCase()
  );

export function listar(_req: Request, res: Response): void {
  res.status(200).json(db.libros);
}

export function obtener(req: Request, res: Response): void {
  res.status(200).json(libroCargado(req));
}

export function crear(req: Request, res: Response): void {
  const body = leerBody(req);
  const { titulo, autor } = body;
  const año = leerAño(body);

  if (!esTextoValido(titulo) || !esTextoValido(autor) || año === undefined) {
    error(res, 400, "Los campos titulo, autor y año son obligatorios");
    return;
  }
  if (!esAñoValido(año)) {
    error(res, 400, "El año debe ser un número entero");
    return;
  }
  if (existeDuplicado(titulo, autor)) {
    error(res, 409, "Ya existe un libro con el mismo título y autor");
    return;
  }

  const nuevo: Libro = {
    id: db.siguienteLibroId++,
    titulo: titulo.trim(),
    autor: autor.trim(),
    año,
    disponible: true,
  };
  db.libros.push(nuevo);
  res.status(201).json(nuevo);
}

// PUT: reemplazo completo (todos los campos obligatorios).
// "disponible" lo gestionan /prestar y /devolver, por lo que se ignora aquí.
export function reemplazar(req: Request, res: Response): void {
  const body = leerBody(req);
  const { titulo, autor } = body;
  const año = leerAño(body);
  const libro = libroCargado(req);

  if (body.id !== undefined && body.id !== libro.id) {
    error(res, 400, "No se puede modificar el id de un libro");
    return;
  }
  if (!esTextoValido(titulo) || !esTextoValido(autor) || año === undefined) {
    error(res, 400, "PUT requiere los campos titulo, autor y año");
    return;
  }
  if (!esAñoValido(año)) {
    error(res, 400, "El año debe ser un número entero");
    return;
  }
  if (existeDuplicado(titulo, autor, libro.id)) {
    error(res, 409, "Ya existe otro libro con el mismo título y autor");
    return;
  }

  libro.titulo = titulo.trim();
  libro.autor = autor.trim();
  libro.año = año;
  res.status(200).json(libro);
}

// PATCH: solo los campos enviados
export function modificar(req: Request, res: Response): void {
  const body = leerBody(req);
  const libro = libroCargado(req);

  if (body.id !== undefined && body.id !== libro.id) {
    error(res, 400, "No se puede modificar el id de un libro");
    return;
  }

  const nuevoAño = leerAño(body);
  const hayCambios =
    body.titulo !== undefined || body.autor !== undefined || nuevoAño !== undefined;
  if (!hayCambios) {
    error(res, 400, "Debes enviar al menos un campo: titulo, autor o año");
    return;
  }

  if (body.titulo !== undefined && !esTextoValido(body.titulo)) {
    error(res, 400, "El titulo debe ser un texto no vacío");
    return;
  }
  if (body.autor !== undefined && !esTextoValido(body.autor)) {
    error(res, 400, "El autor debe ser un texto no vacío");
    return;
  }
  if (nuevoAño !== undefined && !esAñoValido(nuevoAño)) {
    error(res, 400, "El año debe ser un número entero");
    return;
  }

  const titulo = esTextoValido(body.titulo) ? body.titulo.trim() : libro.titulo;
  const autor = esTextoValido(body.autor) ? body.autor.trim() : libro.autor;

  if (existeDuplicado(titulo, autor, libro.id)) {
    error(res, 409, "Ya existe otro libro con el mismo título y autor");
    return;
  }

  libro.titulo = titulo;
  libro.autor = autor;
  if (esAñoValido(nuevoAño)) libro.año = nuevoAño;
  res.status(200).json(libro);
}

export function borrar(req: Request, res: Response): void {
  const libro = libroCargado(req);

  if (!libro.disponible) {
    error(res, 409, "No se puede borrar un libro que está prestado");
    return;
  }
  // splice modifica el array original (importante porque se comparte vía db)
  const indice = db.libros.findIndex((l) => l.id === libro.id);
  db.libros.splice(indice, 1);
  res.status(204).send();
}
