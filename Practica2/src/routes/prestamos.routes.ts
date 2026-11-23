import { Router } from "express";
import * as prestamos from "../controllers/prestamos.controller.js";

const router = Router();

router.get("/", prestamos.listar);

export default router;
