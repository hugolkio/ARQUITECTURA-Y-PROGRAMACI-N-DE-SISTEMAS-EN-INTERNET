import type { NextFunction, Request, Response } from "express";
import { error } from "../utils/helpers.js";

export function notFound(req: Request, res: Response): void {
  error(res, 404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
}

// Express reconoce un handler de errores por sus 4 parámetros
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.parse.failed") {
    error(res, 400, "El body no es un JSON válido");
    return;
  }
  console.error(err);
  error(res, 500, "Error interno del servidor");
}
