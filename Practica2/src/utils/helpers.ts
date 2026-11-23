import type { Request, Response } from "express";
import type { Libro } from "../types/index.js";

export type Body = Record<string, unknown>;

export const error = (res: Response, status: number, mensaje: string): Response =>
  res.status(status).json({ error: mensaje });

export const esTextoValido = (v: unknown): v is string =>
  typeof v === "string" && v.trim() !== "";

export const esAñoValido = (v: unknown): v is number => Number.isInteger(v);

// Express 5 deja req.body como undefined si no hay JSON
export const leerBody = (req: Request): Body => (req.body ?? {}) as Body;

// Acepta "año" o "anio"
export const leerAño = (body: Body): unknown => (body.año !== undefined ? body.año : body.anio);

export const hoy = (): string => new Date().toISOString().slice(0, 10);

// Devuelve el libro cargado por el middleware cargarLibro
export const libroCargado = (req: Request): Libro => {
  if (!req.libro) throw new Error("cargarLibro no se ejecutó antes de este handler");
  return req.libro;
};
