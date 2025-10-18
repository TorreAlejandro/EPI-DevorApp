import { Router } from "@oak/oak";
import { AuthService } from "./authService.ts";

export const authRouter = new Router({ prefix: "/api" });
const authService = new AuthService();

authRouter.post("/login", async (ctx) => {
    try {
        const data = await ctx.request.body.json();
        const result = authService.login(data);

        if (result.success) {
            ctx.response.status = 200;
            ctx.response.body = { token: result.token };
        } else {
            ctx.response.status = 401;
            ctx.response.body = { message: result.message };
            return;
        }
    } catch (err) {
        console.error("Error procesando /login:", err);
        ctx.response.status = 500;
        ctx.response.body = {
            message:
                "Error interno del servidor. Asegúrate de que el body sea JSON válido.",
        };
    }
});
