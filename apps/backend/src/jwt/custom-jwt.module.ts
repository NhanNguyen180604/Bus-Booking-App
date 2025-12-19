import { Module } from "@nestjs/common";
import { AccessJwtProvider } from "./access-jwt.provider";
import { RefreshJwtProvider } from "./refresh-jwt.provider";
import { EmailVerificationJwtProvider } from "./email-verification-jwt.provider";

@Module({
    providers: [AccessJwtProvider, RefreshJwtProvider, EmailVerificationJwtProvider],
    exports: [AccessJwtProvider, RefreshJwtProvider, EmailVerificationJwtProvider],
})
export class CustomJwtModule { }