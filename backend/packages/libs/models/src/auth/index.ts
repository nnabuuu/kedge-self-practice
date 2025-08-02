import { JwtPayloadSchema } from './jwt-payload.schema';
import { UserSchema, AuthRepositorySchemas } from './auth.repository.schema';

export const AuthSchema = {
  jwt_payload: JwtPayloadSchema
};

export {
  UserSchema,
  User,
    UserRoleSchema,
    UserRole,
  AuthRepositorySchemas
} from './auth.repository.schema';

export { JwtPayloadSchema } from './jwt-payload.schema';
