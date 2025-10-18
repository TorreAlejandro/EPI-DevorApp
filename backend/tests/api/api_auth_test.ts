import { assertEquals, assert, assertNotEquals } from "@std/assert";

const API_BASE_URL = "http://localhost:8080/api"; // Asegúrate de que el puerto sea el correcto

Deno.test("Prueba de inicio de sesión exitoso en /login", async () => {
    const loginUrl = `${API_BASE_URL}/login`;

    const credentials = {
        username: "admin",
        password: "1234",
    };

    try {
        const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
        });

        assertEquals(response.status, 200, "Debería devolver un código de estado 200 para un login exitoso");

        const jsonBody = await response.json();

        assert(jsonBody.token, "La respuesta debería contener una propiedad 'token'");

        assertNotEquals(jsonBody.token.length, 0, "El token no debería estar vacío");

    } catch (error) {
        console.error("Error al ejecutar el test. ¿Está la API corriendo en:", API_BASE_URL, "?", error);
        throw error;
    }
});


Deno.test("Prueba de inicio de sesión fallido con credenciales incorrectas", async () => {
    const loginUrl = `${API_BASE_URL}/login`;

    // Datos de prueba para un inicio de sesión fallido
    const credentials = {
        username: "admin",
        password: "123454",
    };

    try {
        const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
        });

        assertEquals(response.status, 401, "Debería devolver un código de estado 401 para credenciales incorrectas");

        const jsonBody = await response.json();

        assertEquals(jsonBody.message, "Credenciales inválidas", "El mensaje de error debería ser 'Credenciales inválidas'");

    } catch (error) {
        console.error("Error al ejecutar el test. ¿Está la API corriendo en:", API_BASE_URL, "?", error);
        throw error;
    }
});