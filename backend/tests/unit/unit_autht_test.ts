import { AuthService } from "../../routes/authService.ts";
import { assertEquals, assert } from "@std/assert";

Deno.test("debería autenticar correctamente con credenciales válidas", () => {
  const service = new AuthService();
  const result = service.login({ username: "admin", password: "1234" });
  assert(result.success);
  assert(result.token);
});

Deno.test("debería fallar con credenciales inválidas", () => {
  const service = new AuthService();
  const result = service.login({ username: "admin", password: "wrong" });
  assertEquals(result.success, false);
  assertEquals(result.message, "Credenciales inválidas");
});

Deno.test("debería fallar si faltan credenciales", () => {
  const service = new AuthService();
  const result = service.login({ username: "", password: "" });
  assertEquals(result.success, false);
  assertEquals(result.message, "Faltan credenciales");
});
