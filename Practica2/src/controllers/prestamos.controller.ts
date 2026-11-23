import type { Request, Response } from "express";
import db from "../data/db.js";
import type { Prestamo } from "../types/index.js";
import { error, esTextoValido, hoy, leerBody, libroCargado } from "../utils/helpers.js";

const MAX_PRESTAMOS_POR_USUARIO = 2;

export function listar(_req: Request, res: Response): void {
  res.status(200).json(db.prestamos);
}

export function historialDeLibro(req: Request, res: Response): void {
  const libro = libroCargado(req);
  res.status(200).json(db.prestamos.filter((p) => p.libroId === libro.id));
}

export function prestar(req: Request, res: Response): void {
  const { usuario } = leerBody(req);
  const libro = libroCargado(req);

  if (!esTextoValido(usuario)) {
    error(res, 400, "El campo usuario es obligatorio y debe ser un texto no vacío");
    return;
  }
  if (!libro.disponible) {
    error(res, 409, "El libro ya está prestado");
    return;
  }

  const nombre = usuario.trim();
  const activos = db.prestamos.filter(
    (p) => p.usuario.toLowerCase() === nombre.toLowerCase() && p.fechaDevolucion === null
  ).length;
  if (activos >= MAX_PRESTAMOS_POR_USUARIO) {
    error(
      res,
      409,
      `${nombre} ya tiene ${MAX_PRESTAMOS_POR_USUARIO} libros prestados (límite alcanzado)`
    );
    return;
  }

  const prestamo: Prestamo = {
    id: db.siguientePrestamoId++,
    libroId: libro.id,
    usuario: nombre,
    fechaPrestamo: hoy(),
    fechaDevolucion: null,
  };
  db.prestamos.push(prestamo);
  libro.disponible = false;
  res.status(201).json(prestamo);
}

export function devolver(req: Request, res: Response): void {
  const libro = libroCargado(req);

  if (libro.disponible) {
    error(res, 409, "El libro no está prestado, no se puede devolver");
    return;
  }

  const prestamo = db.prestamos.find((p) => p.libroId === libro.id && p.fechaDevolucion === null);
  if (!prestamo) {
    error(res, 404, "No se encontró un préstamo activo para este libro");
    return;
  }

  prestamo.fechaDevolucion = hoy();
  libro.disponible = true;
  res.status(200).json(prestamo);
}
