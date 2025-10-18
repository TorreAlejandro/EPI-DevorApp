export interface UserCredentials {
    username: string;
    password: string;
}

export interface AuthResult {
    success: boolean;
    token?: string;
    message?: string;
}

export class AuthService {
    private validUsers: Record<string, string>;

    constructor() {
        this.validUsers = {
            admin: "1234",
            user: "abcd",
        };
    }

    public validateCredentials({ username, password }: UserCredentials): boolean {
        return this.validUsers[username] === password;
    }

    public generateToken(username: string): string {
        return `fake-token-${username}-${Date.now()}`;
    }

    public login(credentials: UserCredentials): AuthResult {
        if (!credentials.username || !credentials.password) {
            return { success: false, message: "Faltan credenciales" };
        }

        if (this.validateCredentials(credentials)) {
            const token = this.generateToken(credentials.username);
            return { success: true, token };
        }

        return { success: false, message: "Credenciales inválidas" };
    }
}
