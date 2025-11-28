import { User as UserEntity } from "../entities/users.entity";

declare global {
    namespace Express {
        interface User extends UserEntity { }
    }
}