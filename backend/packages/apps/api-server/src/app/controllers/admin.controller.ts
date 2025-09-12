import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { pbkdf2Sync, randomBytes } from 'crypto';
import { JwtAuthGuard, AdminGuard } from '@kedge/auth';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';

// Validation schemas
const CreateUserSchema = z.object({
  account: z.string().min(1), // Account ID can be any non-empty string
  password: z.string().min(1).nullable().optional(), // Will be set to account ID if not provided
  name: z.string().min(1),
  role: z.enum(['student', 'teacher', 'admin']),
  class: z.string().nullable().optional() // Class identifier (e.g., '20250101'), required for students
});

const UpdatePasswordSchema = z.object({
  password: z.string().min(6)
});

const BulkCreateUsersSchema = z.array(
  z.object({
    account: z.string().min(1, 'Account ID is required'), // Account ID can be any non-empty string
    password: z.string().min(1).nullable().optional(), // Will be set to account ID if not provided
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['student', 'teacher']),
    class: z.string().nullable().optional() // Class identifier, optional for teachers
  })
);

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly persistentService: PersistentService) {}

  /**
   * Hash password using PBKDF2 (matching auth.service.ts)
   */
  private hashPassword(password: string, salt: string): string {
    const iterations = 1000;
    const keyLength = 64;
    const digest = 'sha512';
    
    // Use Node.js crypto pbkdf2Sync for proper PBKDF2 hashing
    const hashBuffer = pbkdf2Sync(password, salt, iterations, keyLength, digest);
    
    // Return plain hex string (no prefix) to match auth.service.ts
    return hashBuffer.toString('hex');
  }

  /**
   * Get all users with optional search and filtering
   */
  @Get('users')
  @ApiOperation({ summary: 'Get all users with optional filtering (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users matching the criteria' })
  async getAllUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      // Pagination
      const pageNum = parseInt(page || '1', 10);
      const limitNum = parseInt(limit || '50', 10);
      const offset = (pageNum - 1) * limitNum;
      
      // Build WHERE clause conditions using Slonik fragments
      const whereClauses = [];
      
      // Search filter - searches in both account_id and name
      if (search) {
        const searchPattern = `%${search}%`;
        whereClauses.push(sql.fragment`(LOWER(account_id) LIKE LOWER(${searchPattern}) OR LOWER(name) LIKE LOWER(${searchPattern}))`);
      }
      
      // Role filter
      if (role && role !== 'all') {
        whereClauses.push(sql.fragment`role = ${role}`);
      }
      
      // Combine WHERE clauses
      const whereClause = whereClauses.length > 0 
        ? sql.fragment`WHERE ${sql.join(whereClauses, sql.fragment` AND `)}`
        : sql.fragment``;
      
      // Get total count for pagination
      const countResult = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT COUNT(*) as total
        FROM kedge_practice.users
        ${whereClause}
      `);
      
      const totalCount = parseInt(countResult.rows[0].total, 10);
      
      // Get users with pagination
      const result = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT 
          id,
          account_id as email,
          name,
          role,
          class,
          is_admin,
          created_at,
          updated_at,
          preferences,
          CASE 
            WHEN preferences->>'lastLogin' IS NOT NULL 
            THEN (preferences->>'lastLogin')::timestamp
            ELSE NULL
          END as last_login
        FROM kedge_practice.users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `);
      
      return {
        success: true,
        data: result.rows.map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          class: user.class,
          isAdmin: user.is_admin,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLogin: user.last_login
        })),
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a new user
   */
  @Post('users')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() body: any) {
    try {
      // Support both 'account' and 'email' field names for backward compatibility
      const inputData = {
        account: body.account || body.email,
        password: body.password,
        name: body.name,
        role: body.role,
        class: body.class || null
      };
      
      // Validate input
      const validatedData = CreateUserSchema.parse(inputData);
      
      // Validate that students must have a class
      if (validatedData.role === 'student' && !validatedData.class) {
        throw new HttpException('学生必须分配班级', HttpStatus.BAD_REQUEST);
      }
      
      // Check if user already exists
      const existingUser = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT id FROM kedge_practice.users WHERE account_id = ${validatedData.account}
      `);

      if (existingUser.rows.length > 0) {
        throw new HttpException('该账号已存在，请使用其他账号', HttpStatus.CONFLICT);
      }

      // Use account ID as password if password is not provided
      const finalPassword = validatedData.password || validatedData.account;
      
      // Generate salt and hash password
      const salt = randomBytes(16).toString('hex');
      const passwordHash = this.hashPassword(finalPassword, salt);
      
      // Determine is_admin flag
      const isAdmin = validatedData.role === 'admin';

      // Insert new user
      const result = await this.persistentService.pgPool.query(sql.unsafe`
        INSERT INTO kedge_practice.users (
          account_id,
          name,
          password_hash,
          salt,
          role,
          class,
          is_admin,
          preferences,
          created_at,
          updated_at
        ) VALUES (
          ${validatedData.account},
          ${validatedData.name},
          ${passwordHash},
          ${salt},
          ${validatedData.role},
          ${validatedData.class || null},
          ${isAdmin},
          ${sql.json({})},
          NOW(),
          NOW()
        )
        RETURNING id, account_id as email, name, role, class, is_admin, created_at
      `);

      return {
        success: true,
        data: {
          id: result.rows[0].id,
          email: result.rows[0].email,
          name: result.rows[0].name,
          role: result.rows[0].role,
          class: result.rows[0].class,
          isAdmin: result.rows[0].is_admin,
          createdAt: result.rows[0].created_at
        },
        message: 'User created successfully'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          `验证错误: ${error.errors.map(e => e.message).join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Check for database constraint violations
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error creating user:', errorMessage);
      
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate') || errorMessage.includes('violates')) {
        throw new HttpException('该账号已存在，请使用其他账号', HttpStatus.CONFLICT);
      }
      
      throw new HttpException('创建用户失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update user password
   */
  @Put('users/:userId/password')
  @ApiOperation({ summary: 'Update user password (Admin only)' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async updateUserPassword(@Param('userId') userId: string, @Body() body: any) {
    try {
      // Validate input
      const validatedData = UpdatePasswordSchema.parse(body);
      
      // Check if user exists
      const existingUser = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT id, role FROM kedge_practice.users WHERE id = ${userId}
      `);

      if (existingUser.rows.length === 0) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Generate new salt and hash password
      const salt = randomBytes(16).toString('hex');
      const passwordHash = this.hashPassword(validatedData.password, salt);

      // Update password
      const result = await this.persistentService.pgPool.query(sql.unsafe`
        UPDATE kedge_practice.users
        SET 
          password_hash = ${passwordHash},
          salt = ${salt},
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, account_id as email, name
      `);

      return {
        success: true,
        data: {
          id: result.rows[0].id,
          email: result.rows[0].email,
          name: result.rows[0].name
        },
        message: 'Password updated successfully'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error updating password:', error);
      throw new HttpException('Failed to update password', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete a user
   */
  @Delete('users/:userId')
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('userId') userId: string) {
    try {
      // Check if user exists and is not an admin
      const existingUser = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT id, role, is_admin FROM kedge_practice.users WHERE id = ${userId}
      `);

      if (existingUser.rows.length === 0) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (existingUser.rows[0].role === 'admin' || existingUser.rows[0].is_admin) {
        throw new HttpException('Cannot delete admin users', HttpStatus.FORBIDDEN);
      }

      // Delete related data first (cascade delete would be better in production)
      // Delete practice sessions
      await this.persistentService.pgPool.query(sql.unsafe`
        DELETE FROM kedge_practice.practice_sessions WHERE user_id = ${userId}
      `);

      // Delete practice answers
      await this.persistentService.pgPool.query(sql.unsafe`
        DELETE FROM kedge_practice.practice_answers WHERE user_id = ${userId}
      `);

      // Delete the user
      const result = await this.persistentService.pgPool.query(sql.unsafe`
        DELETE FROM kedge_practice.users
        WHERE id = ${userId}
        RETURNING account_id as email, name
      `);

      return {
        success: true,
        data: {
          email: result.rows[0].email,
          name: result.rows[0].name
        },
        message: 'User deleted successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error deleting user:', error);
      throw new HttpException('Failed to delete user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Bulk create users
   */
  @Post('users/bulk')
  @ApiOperation({ summary: 'Bulk create users (Admin only)' })
  @ApiResponse({ status: 201, description: 'Users created successfully' })
  async bulkCreateUsers(@Body() body: any) {
    try {
      // Ensure body is an array
      if (!Array.isArray(body)) {
        throw new HttpException(
          'Request body must be an array of users',
          HttpStatus.BAD_REQUEST
        );
      }
      
      // Support both 'account' and 'email' field names for backward compatibility
      const inputData = body.map((user: any, index: number) => {
        // Check for required fields
        if (!user.account && !user.email) {
          throw new HttpException(
            `User at index ${index}: Account ID is required`,
            HttpStatus.BAD_REQUEST
          );
        }
        
        return {
          account: user.account || user.email,
          password: user.password || null, // Allow null, will be auto-generated
          name: user.name || '',
          role: user.role || 'student',
          class: user.class || null
        };
      });
      
      // Validate input
      const validatedData = BulkCreateUsersSchema.parse(inputData);
      
      // Validate that all students have a class
      for (const userData of validatedData) {
        if (userData.role === 'student' && !userData.class) {
          throw new HttpException(
            `Student ${userData.account} must have a class assigned`,
            HttpStatus.BAD_REQUEST
          );
        }
      }
      
      const results: {
        success: any[];
        failed: any[];
      } = {
        success: [],
        failed: []
      };

      for (const userData of validatedData) {
        try {
          // Check if user already exists
          const existingUser = await this.persistentService.pgPool.query(sql.unsafe`
            SELECT id FROM kedge_practice.users WHERE account_id = ${userData.account}
          `);

          if (existingUser.rows.length > 0) {
            results.failed.push({
              email: userData.account,
              reason: 'User already exists'
            });
            continue;
          }

          // Use account ID as password if password is not provided
          const finalPassword = userData.password || userData.account;
          
          // Generate salt and hash password
          const salt = randomBytes(16).toString('hex');
          const passwordHash = this.hashPassword(finalPassword, salt);
          
          // Insert new user
          const result = await this.persistentService.pgPool.query(sql.unsafe`
            INSERT INTO kedge_practice.users (
              account_id,
              name,
              password_hash,
              salt,
              role,
              class,
              is_admin,
              preferences,
              created_at,
              updated_at
            ) VALUES (
              ${userData.account},
              ${userData.name},
              ${passwordHash},
              ${salt},
              ${userData.role},
              ${userData.class || null},
              ${false},
              ${sql.json({})},
              NOW(),
              NOW()
            )
            RETURNING id, account_id as email, name, role, class
          `);

          results.success.push({
            id: result.rows[0].id,
            email: result.rows[0].email,
            name: result.rows[0].name,
            role: result.rows[0].role,
            class: result.rows[0].class
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          let reason = '创建用户失败';
          
          if (errorMessage.includes('unique') || errorMessage.includes('duplicate') || errorMessage.includes('violates')) {
            reason = '该账号已存在';
          }
          
          results.failed.push({
            email: userData.account,
            reason: reason
          });
        }
      }

      return {
        success: true,
        data: results,
        message: `Created ${results.success.length} users, ${results.failed.length} failed`
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }
      console.error('Error bulk creating users:', error);
      throw new HttpException('Failed to bulk create users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get user statistics
   */
  @Get('users/stats')
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  async getUserStats() {
    try {
      const result = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT 
          COUNT(*) FILTER (WHERE role = 'student') as total_students,
          COUNT(*) FILTER (WHERE role = 'teacher') as total_teachers,
          COUNT(*) FILTER (WHERE role = 'admin' OR is_admin = true) as total_admins,
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
          COUNT(*) FILTER (WHERE preferences->>'lastLogin' IS NOT NULL 
            AND (preferences->>'lastLogin')::timestamp > NOW() - INTERVAL '7 days') as active_users_7d
        FROM kedge_practice.users
      `);
      
      return {
        success: true,
        data: {
          totalStudents: parseInt(result.rows[0].total_students),
          totalTeachers: parseInt(result.rows[0].total_teachers),
          totalAdmins: parseInt(result.rows[0].total_admins),
          totalUsers: parseInt(result.rows[0].total_users),
          newUsers30Days: parseInt(result.rows[0].new_users_30d),
          activeUsers7Days: parseInt(result.rows[0].active_users_7d)
        }
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new HttpException('Failed to fetch user statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}