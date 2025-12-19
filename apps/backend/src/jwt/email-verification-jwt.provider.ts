import { JwtService } from "@nestjs/jwt";
import { RootConfig } from "../config/config";
import { convertToMs } from "../utils/convert-to-ms";

export const EMAIL_VERIFICATION_JWT = 'EMAIL_VERIFICATION_JWT';

export const EmailVerificationJwtProvider = {
    provide: EMAIL_VERIFICATION_JWT,
    inject: [RootConfig],
    useFactory: (config: RootConfig) => {
        return new JwtService({
            secret: config.jwt.email_verification_token.secret,
            signOptions: {
                expiresIn: convertToMs(config.jwt.email_verification_token.expires_in),
            },
        });
    }
}