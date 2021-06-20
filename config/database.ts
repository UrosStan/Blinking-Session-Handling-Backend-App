import { ConnectionOptions } from "typeorm";

//Env file if we decide to use it
//Don't forget to put it in git ignore!
const config: ConnectionOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "pass",
  database: process.env.POSTGRES_DB || "postgres",
  entities: [],
  synchronize: true,
};

export default config;