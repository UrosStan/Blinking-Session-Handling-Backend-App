import express from "express";
import { createConnection } from "typeorm";
import dbConfig from "../config/database";

const app = express()
const port = 3000

const members = [

  {
    id:1,
    name: 'John Doe',
    email: 'johndoe@gmail.com',
    status: 'active'
  },
  {
    id:2,
    name: 'Petar Peric',
    email: 'petar@gmail.com',
    status: 'active'
  },
  {
    id:3,
    name: 'Jovan Jovanovic',
    email: 'jovan@gmail.com',
    status: 'inactive'
  },

]
app.get('/',(req,res ) => {
    res.send("Working");
})

app.get('/members', (req,res) =>res.json(members))


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

