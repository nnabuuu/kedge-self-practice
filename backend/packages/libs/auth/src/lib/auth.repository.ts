import { Injectable, Logger } from "@nestjs/common";
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import { UserSchema, User } from '@kedge/models';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly persistentService: PersistentService) {}

  /**
   * 创建新用户
   */
  async createUser(data: { wallet_address: string, username: string }): Promise<User> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(UserSchema)`
          INSERT INTO kedge_gateway.users (
            wallet_address,
            username,
            created_at,
            updated_at
          )
          VALUES (
            ${data.wallet_address},
            ${data.username},
            now(),
            now()
          )
          RETURNING *
        `
      );

      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating user: ${errorMessage}`);
      throw new Error('Failed to create user');
    }
  }
}
