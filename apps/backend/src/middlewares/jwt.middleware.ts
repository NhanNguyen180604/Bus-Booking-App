import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor(
        @Inject('ACCESS_JWT')
        private readonly accessJwtService: JwtService,
        @Inject('REFRESH_JWT')
        private readonly refreshJwtService: JwtService,
    ) { }

    use(req: Request, res: Response, next: NextFunction) {
        next();
    }
}