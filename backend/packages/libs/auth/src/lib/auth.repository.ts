import { Injectable, Logger } from "@nestjs/common";
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import { UserSchema, User, UserRole } from '@kedge/models';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly persistentService: PersistentService) {}

  /**
   * create new user
   */
  async createUser(data: { name: string, password: string, role: UserRole }): Promise<User> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(UserSchema)`
          INSERT INTO kedge_gateway.users (
// TODO: add more
            updated_at
          )
          VALUES (
// TODO: add more
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
