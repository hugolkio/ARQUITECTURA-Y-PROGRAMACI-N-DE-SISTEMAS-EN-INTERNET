import type { Request, Response } from "express";
import db from "../data/db.js";
import type { AutorConMasLibros } from "../types/index.js";

export function obtener(_req: Request, res: Response): void {
  const total = db.libros.length;
  const disponibles = db.libros.filter((l) => l.disponible).length;

  const conteo: Record<string, number> = {};
  for (const l of db.libros) conteo[l.autor] = (conteo[l.autor] ?? 0) + 1;

  let autorConMasLibros: AutorConMasLibros | null = null;
  for (const [autor, cantidad] of Object.entries(conteo)) {
    if (!autorConMasLibros || cantidad > autorConMasLibros.cantidad) {
      autorConMasLibros = { autor, cantidad };
    }
  }

  res.status(200).json({
    totalLibros: total,
    disponibles,
    prestados: total - disponibles,
    autorConMasLibros,
  });
}
