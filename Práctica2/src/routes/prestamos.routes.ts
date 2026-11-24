import { Router } from "express";
import { getPrestamos } from "../controllers/prestamos.controller.js";


const router = Router();


router.get("/", getPrestamos);


export default router;
