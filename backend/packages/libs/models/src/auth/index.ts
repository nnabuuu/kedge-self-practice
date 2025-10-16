import { JwtPayloadSchema } from './jwt-payload.schema';
import {
  UserSchema,
  UserWithCredentialsSchema,
  AuthRepositorySchemas,
} from './auth.repository.schema';

export const AuthSchema = {
  jwt_payload: JwtPayloadSchema
};

export {
  UserSchema,
  User,
  UserWithCredentialsSchema,
  UserWithCredentials,
  UserRoleSchema,
  UserRole,
  AuthRepositorySchemas,
} from './auth.repository.schema';

export { JwtPayloadSchema } from './jwt-payload.schema';

export {
  SignUpSchema,
  SignUpRequest,
  SignInSchema,
  SignInRequest,
  AuthResponseSchema,
  AuthResponse,
  AuthApiSchemas,
} from './auth-api.schema';
