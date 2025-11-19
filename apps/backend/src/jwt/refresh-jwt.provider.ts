import { JwtService } from "@nestjs/jwt";
import { RootConfig } from "../config/config";
import { convertToMs } from "@backend/utils/convert-to-ms";

export const RefreshJwtProvider = {
    provide: 'REFRESH_JWT',
    inject: [RootConfig],
    useFactory: (config: RootConfig) => {
        return new JwtService({
            secret: config.jwt.refresh_token.secret,
            signOptions: {
                expiresIn: convertToMs(config.jwt.refresh_token.expires_in ),
            },
        });
    }
}