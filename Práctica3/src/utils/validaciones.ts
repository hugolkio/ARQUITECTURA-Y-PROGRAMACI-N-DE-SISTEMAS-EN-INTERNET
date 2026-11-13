export const esObjectIdValido = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
}

export const esImporteValido = (importe: unknown): importe is number => {
    return typeof importe === "number" && Number.isSafeInteger(importe) && importe > 0;
}

// Valida el body de ingresos, retiradas y transferencias. Si algo falla devuelve el mensaje de error
export const leerOperacion = (body: any): { importe: number, concepto: string, categoria: string } | string => {
    const importe = body?.importe;
    const concepto = body?.concepto;
    const categoria = body?.categoria;

    if(!esImporteValido(importe)){
        return "El importe debe ser un entero mayor que 0 (en céntimos)";
    }

    if(typeof concepto !== "string" || concepto.trim() === ""){
        return "El concepto es obligatorio";
    }

    if(categoria !== undefined && (typeof categoria !== "string" || categoria.trim() === "")){
        return "La categoría debe ser un texto no vacío";
    }

    return {
        importe,
        concepto: concepto.trim(),
        categoria: categoria === undefined ? "otros" : categoria.trim()
    };
}
