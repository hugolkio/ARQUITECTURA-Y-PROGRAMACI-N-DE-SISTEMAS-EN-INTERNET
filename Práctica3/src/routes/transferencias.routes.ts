import { Router } from "express";
import { createTransferencia } from "../controllers/transferencias.controller.js";



const router = Router();


router.post("/", createTransferencia);



export default router;
