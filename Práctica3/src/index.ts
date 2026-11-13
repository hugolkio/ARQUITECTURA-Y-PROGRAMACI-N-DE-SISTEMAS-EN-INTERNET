import express from "express";
import clientesRoutes from "./routes/clientes.routes.js"
import cuentasRoutes from "./routes/cuentas.routes.js"
import transferenciasRoutes from "./routes/transferencias.routes.js"
import { connectMongo } from "./config/database.js";
import { configClientesCollection } from "./controllers/clientes.controller.js";
import { configCuentasCollection } from "./controllers/cuentas.controller.js";
import { configTransferenciasCollection } from "./controllers/transferencias.controller.js";
import type { Collection } from "mongodb";
import type { ClienteT } from "./models/clientes.model.js";
import type { CuentaT } from "./models/cuentas.model.js";
import type { MovimientoT } from "./models/movimientos.model.js";




const app = express();

app.use(express.json());

const startServer = () => {


    connectMongo().then(async (db)=>{
        const clientesCollection:Collection<ClienteT> = db.collection("clientes");
        const cuentasCollection:Collection<CuentaT> = db.collection("cuentas");
        const movimientosCollection:Collection<MovimientoT> = db.collection("movimientos");

        // Índices únicos: de ellos depende el 409 por duplicados
        await clientesCollection.createIndex({ email: 1 }, { unique: true });
        await clientesCollection.createIndex({ dni: 1 }, { unique: true });
        await cuentasCollection.createIndex({ iban: 1 }, { unique: true });

        configClientesCollection(clientesCollection);
        configCuentasCollection(clientesCollection, cuentasCollection, movimientosCollection);
        configTransferenciasCollection(cuentasCollection, movimientosCollection);

        app.use("/clientes",clientesRoutes);
        app.use("/cuentas",cuentasRoutes);
        app.use("/transferencias",transferenciasRoutes);

        const port = process.env.PORT;

        app.listen(port, ()=>{
            console.log(`Api funcionando en el puerto ${port}`)
        })

    }).catch((error)=>{
        console.log(error)
        console.log("No se ha podido arrancar la API porque falla la conexión con Mongo")
    })

};

startServer();
