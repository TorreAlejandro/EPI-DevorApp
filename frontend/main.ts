import { Application, send } from "@oak/oak";

const app = new Application();

app.use(async (ctx) => {
    try {
        await send(ctx, ctx.request.url.pathname, {
            root: `${Deno.cwd()}/dist`,
            index: "index.html",
        });
    } catch {
        await send(ctx, "index.html", { root: `${Deno.cwd()}/dist` });
    }
});

const PORT = Number(Deno.env.get("FRONTEND_PORT") || 5173);
console.log(`Frontend running at http://localhost:${PORT}`);
await app.listen({ port: PORT });