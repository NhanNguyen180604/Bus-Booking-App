import { User as UserEntity } from "../users/users.entity";

declare global {
    namespace Express {
        interface User extends UserEntity { }
    }
}