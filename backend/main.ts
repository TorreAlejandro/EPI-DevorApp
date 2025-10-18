import { Application } from "@oak/oak";
import { authRouter } from "./routes/authRouter.ts";
import { oakCors } from "cors";

const app = new Application();


app.use(
    oakCors({
        origin: "http://localhost:5173", // O "*" para permitir todos
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

console.log("Backend running at http://localhost:8080");
await app.listen({ port: 8080 });