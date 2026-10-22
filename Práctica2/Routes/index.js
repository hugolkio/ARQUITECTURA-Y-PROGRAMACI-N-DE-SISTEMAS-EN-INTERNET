const { Router } = require("express");
const librosRoutes = require("./libros.routes");
const prestamosRoutes = require("./prestamos.routes");
const estadisticasRoutes = require("./estadisticas.routes");

const router = Router();

router.use("/libros", librosRoutes);
router.use("/prestamos", prestamosRoutes);
router.use("/estadisticas", estadisticasRoutes);

module.exports = router;