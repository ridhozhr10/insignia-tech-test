import { meaningOfLife } from "@ridhozhr10/foo";
import { loadEnv } from "@ridhozhr10/config";

loadEnv();

console.log(meaningOfLife);
console.log("POSTGRES_DB:", process.env.POSTGRES_DB);
console.log("REDIS_HOST:", process.env.REDIS_HOST);
