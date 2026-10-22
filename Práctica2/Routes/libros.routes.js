const { Router } = require("express");
const cargarLibro = require("../middlewares/cargarLibro");
const libros = require("../controllers/libros.controller");
const prestamos = require("../controllers/prestamos.controller");

const router = Router();

router.get("/", libros.listar);
router.post("/", libros.crear);

router.get("/:id", cargarLibro, libros.obtener);
router.put("/:id", cargarLibro, libros.reemplazar);
router.patch("/:id", cargarLibro, libros.modificar);
router.delete("/:id", cargarLibro, libros.borrar);

// Rutas anidadas de préstamos
router.get("/:id/prestamos", cargarLibro, prestamos.historialDeLibro);
router.post("/:id/prestar", cargarLibro, prestamos.prestar);
router.post("/:id/devolver", cargarLibro, prestamos.devolver);

module.exports = router;

