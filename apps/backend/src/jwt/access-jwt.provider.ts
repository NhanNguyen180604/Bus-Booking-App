import { JwtService } from "@nestjs/jwt";
import { RootConfig } from "../config/config";
import { convertToMs } from "../utils/convert-to-ms";

export const AccessJwtProvider = {
    provide: 'ACCESS_JWT',
    inject: [RootConfig],
    useFactory: (config: RootConfig) => {
        return new JwtService({
            secret: config.jwt.access_token.secret,
            signOptions: {
                expiresIn: convertToMs(config.jwt.access_token.expires_in),
            },
        });
    }
}