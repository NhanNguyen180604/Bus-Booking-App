import { Injectable } from '@nestjs/common';
import { UserLoginDtoType } from './users.dto';

@Injectable()
export class UsersService {
    constructor() { }

    async login(dto: UserLoginDtoType) {
        return dto.email + '/' + dto.password + ' ';
    }
}
