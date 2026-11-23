export interface Libro {
  id: number;
  titulo: string;
  autor: string;
  año: number;
  disponible: boolean;
}

export interface Prestamo {
  id: number;
  libroId: number;
  usuario: string;
  fechaPrestamo: string;
  fechaDevolucion: string | null;
}

export interface Db {
  libros: Libro[];
  prestamos: Prestamo[];
  siguienteLibroId: number;
  siguientePrestamoId: number;
}

export interface AutorConMasLibros {
  autor: string;
  cantidad: number;
}

// Permite usar req.libro (lo rellena el middleware cargarLibro)
declare global {
  namespace Express {
    interface Request {
      libro?: Libro;
    }
  }
}
