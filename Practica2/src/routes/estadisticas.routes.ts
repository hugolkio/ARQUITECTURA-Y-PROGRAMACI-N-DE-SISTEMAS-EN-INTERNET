import { Router } from "express";
import * as estadisticas from "../controllers/estadisticas.controller.js";

const router = Router();

router.get("/", estadisticas.obtener);

export default router;
