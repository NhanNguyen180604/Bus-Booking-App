import { Allow, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

export class TokenConfig {
    @Allow()
    public readonly secret!: string;

    @Allow()
    public readonly expires_in!: string;
}

export class JwtConfig {
    @Type(() => TokenConfig)
    @ValidateNested()
    public readonly access_token!: TokenConfig;

    @Type(() => TokenConfig)
    @ValidateNested()
    public readonly refresh_token!: TokenConfig;
};

export class CookieConfig {
    @Allow()
    public readonly secret!: string;

    @Allow()
    public readonly access_token_max_age!: string;

    @Allow()
    public readonly refresh_token_max_age!: string;
};

export class DatabaseConfig {
    @Allow()
    public readonly url!: string;
};

export class RootConfig {
    @Allow()
    public readonly port!: number;

    @Allow()
    public readonly frontend_url!: string;

    @Type(() => JwtConfig)
    @Allow()
    public readonly jwt!: JwtConfig;

    @Type(() => CookieConfig)
    @Allow()
    public readonly cookie!: CookieConfig;

    @Type(() => DatabaseConfig)
    @Allow()
    public readonly database!: DatabaseConfig;
};