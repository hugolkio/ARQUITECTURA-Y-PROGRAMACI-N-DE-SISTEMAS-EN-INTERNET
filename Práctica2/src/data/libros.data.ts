import type { LibroT, PrestamoT } from "../models/libros.model.js";


export let libros: LibroT[] = [ //export let libros crea una variable pública. Usa let y no const porque más adelante se le va a asignar otro valor.
    { id: 1, titulo: "Clean Code", autor: "Robert C. Martin", año: 2008, disponible: true },
    { id: 2, titulo: "El Quijote", autor: "Miguel de Cervantes", año: 1605, disponible: true },
    { id: 3, titulo: "Sapiens", autor: "Yuval Noah Harari", año: 2011, disponible: false }
]

export let prestamos: PrestamoT[] = [
    { id: 1, libroId: 3, usuario: "Ana", fechaPrestamo: "2026-10-01", fechaDevolucion: null }
]

export const changeLibros = (librosParam: LibroT[]) => { //Esta función cambia la lista entera de libros por otra que le pases.
    libros = librosParam
}

export const changePrestamos = (prestamosParam: PrestamoT[]) => {
    prestamos = prestamosParam
}
