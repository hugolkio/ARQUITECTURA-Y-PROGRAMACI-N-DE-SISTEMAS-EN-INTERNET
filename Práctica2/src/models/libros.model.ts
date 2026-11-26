export type LibroT = { //libro es un objeto
    id: number,
    titulo: string,
    autor: string,
    año: number,
    disponible: boolean
}

export type PrestamoT = {
    id: number,
    libroId: number,
    usuario: string,
    fechaPrestamo: string,
    fechaDevolucion: string | null  //Mientras el libro no se devuelve, fechaDevolucion es null
}
