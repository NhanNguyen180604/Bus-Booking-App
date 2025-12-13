// Source - https://stackoverflow.com/a
// Posted by Joel Raju, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-13, License - CC BY-SA 4.0

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as bodyParser from 'body-parser';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: () => any) {
        bodyParser.raw({ type: '*/*' })(req, res, next);
    }
}
