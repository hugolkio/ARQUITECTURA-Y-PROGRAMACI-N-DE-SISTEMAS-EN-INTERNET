import type { Request, Response } from "express";
import { libros } from "../data/libros.data.js";


export const getEstadisticas = (
    req: Request,
    res: Response
) => {
    const total = libros.length;
    const disponibles = libros.filter((l) => l.disponible).length;

    const conteo: Record<string, number> = {};
    for (const l of libros) {
        conteo[l.autor] = (conteo[l.autor] ?? 0) + 1;
    }

    let autorConMasLibros: { autor: string, cantidad: number } | null = null;
    for (const [autor, cantidad] of Object.entries(conteo)) {
        if (!autorConMasLibros || cantidad > autorConMasLibros.cantidad) {
            autorConMasLibros = { autor, cantidad };
        }
    }

    res.json({
        totalLibros: total,
        disponibles,
        prestados: total - disponibles,
        autorConMasLibros
    })
}
