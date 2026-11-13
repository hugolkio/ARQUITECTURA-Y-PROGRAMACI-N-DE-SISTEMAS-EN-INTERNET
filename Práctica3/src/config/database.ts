import { Db, MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;

if(!uri){
    throw new Error("Falta la variable MONGO_URI en el .env");
}

const client = new MongoClient(uri);



export const connectMongo = ():Promise<Db> => {

    return client.connect().then(()=>{
        console.log("Conectado al Monguito");

        return client.db("Banco")
    }).catch((error)=>{
        console.log("Error al conectar con Mongo");
        throw error;
    })

}
