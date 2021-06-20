import express, { Request, Response, Router } from "express";
import { createConnection } from "typeorm";
import dbConfig from "../config/database";

//Starting the server
const app = express()
const port = 3000

app.get('/',(req:Request,res:Response, next) => {
    res.send("Working working");
    next();

})
app.get('/',(req:Request,res:Response) => {
  console.log("Nesto");

})

//Ovde ide logika
app.use('/createSession'),(req:Request, res:Response) => {

}

app.use('/finishStep'),(req:Request, res:Response) => {

}

app.use('/getSessions'),(req:Request, res:Response) => {

}

//Trying to connect to database
createConnection(dbConfig)
  .then((_connection) => {
    app.listen(port, () => {
      console.log("Server is running on port", port);
    });
  })
  .catch((err) => {
    console.log("Unable to connect to db", err);
    process.exit(1);
  });

