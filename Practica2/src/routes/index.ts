import { Router } from "express";
import librosRoutes from "./libros.routes.js";
import prestamosRoutes from "./prestamos.routes.js";
import estadisticasRoutes from "./estadisticas.routes.js";

const router = Router();

router.use("/libros", librosRoutes);
router.use("/prestamos", prestamosRoutes);
router.use("/estadisticas", estadisticasRoutes);

export default router;
