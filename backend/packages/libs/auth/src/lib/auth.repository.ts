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
    class?: string | null;
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
            class,
            created_at,
            updated_at
          )
          VALUES (
            ${data.name},
            ${data.accountId},
            ${data.passwordHash},
            ${data.salt},
            ${data.role},
            ${data.class || null},
            now(),
            now()
          )
          RETURNING id, name, account_id, role, class, created_at, updated_at
        `,
      );

      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating user: ${errorMessage}`);
      
      // Check for unique constraint violation
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        throw new Error('User with this account already exists');
      }
      
      throw new Error('Failed to create user');
    }
  }

  async findUserById(userId: string): Promise<UserWithCredentials | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(UserWithCredentialsSchema)`
          SELECT id,
                 name,
                 account_id,
                 password_hash,
                 salt,
                 role,
                 class,
                 created_at,
                 updated_at
          FROM kedge_practice.users
          WHERE id = ${userId}
        `,
      );

      return result.rows[0] ?? null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding user by ID: ${errorMessage}`);
      throw new Error('Failed to find user');
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
                 class,
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
                 class,
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

  /**
   * Get user preferences by user ID
   */
  async getUserPreferences(userId: string): Promise<Record<string, any> | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT preferences
          FROM kedge_practice.users
          WHERE id = ${userId}
        `,
      );

      return result.rows[0]?.preferences ?? null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting user preferences: ${errorMessage}`);
      throw new Error('Failed to get user preferences');
    }
  }

  /**
   * Update user preferences by user ID
   */
  async updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<void> {
    try {
      await this.persistentService.pgPool.query(
        sql.unsafe`
          UPDATE kedge_practice.users
          SET preferences = ${sql.json(preferences)},
              updated_at = now()
          WHERE id = ${userId}
        `,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error updating user preferences: ${errorMessage}`);
      throw new Error('Failed to update user preferences');
    }
  }

  /**
   * Update specific preference key for user
   */
  async updateUserPreference(userId: string, key: string, value: any): Promise<void> {
    try {
      // First get current preferences, then update the specific key
      const currentPrefsResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT preferences
          FROM kedge_practice.users
          WHERE id = ${userId}
        `,
      );
      
      const currentPrefs = currentPrefsResult.rows[0]?.preferences || {};
      const updatedPrefs = { ...currentPrefs, [key]: value };
      
      await this.persistentService.pgPool.query(
        sql.unsafe`
          UPDATE kedge_practice.users
          SET preferences = ${sql.json(updatedPrefs)},
              updated_at = now()
          WHERE id = ${userId}
        `,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error updating user preference: ${errorMessage}`);
      throw new Error('Failed to update user preference');
    }
  }

  async updateUserPassword(userId: string, passwordHash: string, salt: string): Promise<void> {
    try {
      await this.persistentService.pgPool.query(
        sql.unsafe`
          UPDATE kedge_practice.users
          SET password_hash = ${passwordHash},
              salt = ${salt},
              updated_at = now()
          WHERE id = ${userId}
        `,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error updating user password: ${errorMessage}`);
      throw new Error('Failed to update user password');
    }
  }
}
