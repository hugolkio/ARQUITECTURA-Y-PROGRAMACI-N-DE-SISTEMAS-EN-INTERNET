export type PaginacionT = {
    pagina: number,
    limite: number
}

const leerEntero = (valor: unknown, porDefecto: number): number | null => {
    if(valor === undefined){
        return porDefecto;
    }

    if(typeof valor !== "string" || !/^\d+$/.test(valor) || Number(valor) < 1){
        return null;
    }

    return Number(valor);
}

// pagina=1 y limite=20 por defecto; el límite máximo es 100. Devuelve null si los parámetros no son válidos
export const leerPaginacion = (query: Record<string, unknown>): PaginacionT | null => {
    const pagina = leerEntero(query.pagina, 1);
    const limite = leerEntero(query.limite, 20);

    if(pagina === null || limite === null){
        return null;
    }

    return {
        pagina,
        limite: Math.min(limite, 100)
    };
}

export const respuestaPaginada = <T>(datos: T[], totalElementos: number, paginacion: PaginacionT) => {
    return {
        datos,
        pagina: paginacion.pagina,
        limite: paginacion.limite,
        totalElementos,
        totalPaginas: Math.ceil(totalElementos / paginacion.limite)
    };
}
