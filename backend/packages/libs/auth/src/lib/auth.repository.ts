import { Injectable, Logger } from "@nestjs/common";
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';

import {
  UserSchema,
  UserWithCredentialsSchema,
  User,
  UserWithCredentials,
  UserRole,
} from '@kedge/models';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly persistentService: PersistentService) {}

  /**
   * create new user
   */
  async createUser(data: {
    name: string | null;
    accountId: string;
    passwordHash: string;
    salt: string;
    role: UserRole;
  }): Promise<User> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(UserSchema)`
          INSERT INTO kedge_practice.users (
            name,
            account_id,
            password_hash,
            salt,
            role,
            created_at,
            updated_at
          )
          VALUES (
            ${data.name},
            ${data.accountId},
            ${data.passwordHash},
            ${data.salt},
            ${data.role},
            now(),
            now()
          )
          RETURNING id, name, account_id, role, created_at, updated_at
        `,
      );

      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating user: ${errorMessage}`);
      throw new Error('Failed to create user');
    }
  }

  async findUserByAccountId(accountId: string): Promise<UserWithCredentials | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(UserWithCredentialsSchema)`
          SELECT id,
                 name,
                 account_id,
                 password_hash,
                 salt,
                 role,
                 created_at,
                 updated_at
          FROM kedge_practice.users
          WHERE account_id = ${accountId}
        `,
      );

      return result.rows[0] ?? null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding user by account ID: ${errorMessage}`);
      throw new Error('Failed to find user');
    }
  }

  // Keep backward compatibility method
  async findUserByName(name: string): Promise<UserWithCredentials | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(UserWithCredentialsSchema)`
          SELECT id,
                 name,
                 account_id,
                 password_hash,
                 salt,
                 role,
                 created_at,
                 updated_at
          FROM kedge_practice.users
          WHERE name = ${name}
        `,
      );

      return result.rows[0] ?? null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding user by name: ${errorMessage}`);
      throw new Error('Failed to find user');
    }
  }
}
