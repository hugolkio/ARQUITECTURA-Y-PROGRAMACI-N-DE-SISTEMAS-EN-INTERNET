import type { NextFunction, Request, Response } from "express";
import db from "../data/db.js";
import { error } from "../utils/helpers.js";

// Valida :id y carga el libro en req.libro
export function cargarLibro(req: Request, res: Response, next: NextFunction): void {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    error(res, 400, "El id debe ser un número entero");
    return;
  }

  const libro = db.libros.find((l) => l.id === id);
  if (!libro) {
    error(res, 404, `No existe un libro con id ${id}`);
    return;
  }

  req.libro = libro;
  next();
}
