import { Module } from "@nestjs/common";
import { AccessJwtProvider } from "./access-jwt.provider";
import { RefreshJwtProvider } from "./refresh-jwt.provider";

@Module({
    providers: [AccessJwtProvider, RefreshJwtProvider],
    exports: [AccessJwtProvider, RefreshJwtProvider],
})
export class CustomJwtModule { }