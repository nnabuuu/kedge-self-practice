# 智能练习测验系统 - NestJS后端设计文档

## 📋 文档信息

| 项目名称 | 智能练习测验系统后端 |
|---------|-------------------|
| 技术栈 | NestJS + TypeScript + PostgreSQL + Redis |
| 版本 | v1.0 |
| 创建日期 | 2025年1月 |
| 文档类型 | 后端架构设计 |

---

## 🏗️ 系统架构概览

### 技术栈选择
- **框架**: NestJS (基于Express/Fastify)
- **语言**: TypeScript
- **数据库**: PostgreSQL (主数据库)
- **缓存**: Redis (会话、缓存)
- **ORM**: TypeORM
- **认证**: JWT + Passport
- **文件存储**: AWS S3 / 阿里云OSS
- **AI服务**: OpenAI API / 百度文心一言
- **消息队列**: Bull Queue (基于Redis)

### 架构模式
- **分层架构**: Controller → Service → Repository
- **模块化设计**: 按业务领域划分模块
- **依赖注入**: NestJS内置DI容器
- **事件驱动**: EventEmitter2 处理业务事件

---

## 📦 核心模块设计

### 1. 认证授权模块 (AuthModule)

#### 1.1 文件结构
```
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── refresh-token.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── local-auth.guard.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── local.strategy.ts
└── decorators/
    ├── roles.decorator.ts
    └── current-user.decorator.ts
```

#### 1.2 主要功能
- **用户注册/登录**: 支持邮箱密码登录
- **JWT令牌管理**: 访问令牌 + 刷新令牌
- **角色权限控制**: 学生、教师、管理员角色
- **会话管理**: Redis存储会话信息
- **密码安全**: bcrypt加密存储

#### 1.3 API端点
```typescript
POST /auth/login          // 用户登录
POST /auth/register       // 用户注册
POST /auth/refresh        // 刷新令牌
POST /auth/logout         // 用户登出
GET  /auth/profile        // 获取用户信息
PUT  /auth/profile        // 更新用户信息
POST /auth/change-password // 修改密码
```

### 2. 用户管理模块 (UsersModule)

#### 2.1 文件结构
```
src/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── entities/
│   ├── user.entity.ts
│   └── user-profile.entity.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-query.dto.ts
└── repositories/
    └── users.repository.ts
```

#### 2.2 数据模型
```typescript
// User Entity
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => UserProfile)
  profile: UserProfile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// UserProfile Entity
@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'json', nullable: true })
  preferences: UserPreferences;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
```

#### 2.3 API端点
```typescript
GET    /users              // 获取用户列表(管理员)
GET    /users/:id          // 获取用户详情
PUT    /users/:id          // 更新用户信息
DELETE /users/:id          // 删除用户(管理员)
GET    /users/:id/stats    // 获取用户学习统计
```

### 3. 学科管理模块 (SubjectsModule)

#### 3.1 文件结构
```
src/subjects/
├── subjects.module.ts
├── subjects.controller.ts
├── subjects.service.ts
├── entities/
│   └── subject.entity.ts
├── dto/
│   ├── create-subject.dto.ts
│   └── update-subject.dto.ts
└── repositories/
    └── subjects.repository.ts
```

#### 3.2 数据模型
```typescript
@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => KnowledgePoint, kp => kp.subject)
  knowledgePoints: KnowledgePoint[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 3.3 API端点
```typescript
GET    /subjects           // 获取学科列表
GET    /subjects/:id       // 获取学科详情
POST   /subjects           // 创建学科(管理员)
PUT    /subjects/:id       // 更新学科(管理员)
DELETE /subjects/:id       // 删除学科(管理员)
```

### 4. 知识点管理模块 (KnowledgePointsModule)

#### 4.1 文件结构
```
src/knowledge-points/
├── knowledge-points.module.ts
├── knowledge-points.controller.ts
├── knowledge-points.service.ts
├── entities/
│   └── knowledge-point.entity.ts
├── dto/
│   ├── create-knowledge-point.dto.ts
│   ├── update-knowledge-point.dto.ts
│   └── knowledge-point-query.dto.ts
└── repositories/
    └── knowledge-points.repository.ts
```

#### 4.2 数据模型
```typescript
@Entity('knowledge_points')
export class KnowledgePoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  volume: string;        // 分册

  @Column()
  unit: string;          // 单元

  @Column()
  lesson: string;        // 单课

  @Column()
  section: string;       // 子目

  @Column()
  topic: string;         // 知识点

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Subject, subject => subject.knowledgePoints)
  subject: Subject;

  @Column()
  subjectId: string;

  @OneToMany(() => Question, question => question.knowledgePoint)
  questions: Question[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 4.3 API端点
```typescript
GET    /knowledge-points                    // 获取知识点列表
GET    /knowledge-points/:id               // 获取知识点详情
POST   /knowledge-points                   // 创建知识点
PUT    /knowledge-points/:id               // 更新知识点
DELETE /knowledge-points/:id               // 删除知识点
GET    /knowledge-points/subject/:subjectId // 按学科获取知识点
GET    /knowledge-points/tree/:subjectId   // 获取知识点树结构
```

### 5. 题库管理模块 (QuestionsModule)

#### 5.1 文件结构
```
src/questions/
├── questions.module.ts
├── questions.controller.ts
├── questions.service.ts
├── entities/
│   ├── question.entity.ts
│   └── question-option.entity.ts
├── dto/
│   ├── create-question.dto.ts
│   ├── update-question.dto.ts
│   ├── question-query.dto.ts
│   └── bulk-import.dto.ts
└── repositories/
    └── questions.repository.ts
```

#### 5.2 数据模型
```typescript
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'json', nullable: true })
  options: QuestionOptions;

  @Column({ type: 'json' })
  answer: string | string[];

  @Column({ type: 'text', nullable: true })
  standardAnswer: string;

  @Column({ type: 'text', nullable: true })
  standardStructure: string;

  @Column({ type: 'json', nullable: true })
  evaluationCriteria: Record<string, string>;

  @Column({ type: 'enum', enum: DifficultyLevel })
  difficulty: DifficultyLevel;

  @Column({ type: 'json', default: [] })
  tags: string[];

  @ManyToOne(() => KnowledgePoint, kp => kp.questions)
  knowledgePoint: KnowledgePoint;

  @Column()
  knowledgePointId: string;

  @ManyToOne(() => User)
  createdBy: User;

  @Column()
  createdById: string;

  @Column({ type: 'enum', enum: QuestionStatus, default: 'draft' })
  status: QuestionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 5.3 API端点
```typescript
GET    /questions                          // 获取题目列表
GET    /questions/:id                      // 获取题目详情
POST   /questions                          // 创建题目
PUT    /questions/:id                      // 更新题目
DELETE /questions/:id                      // 删除题目
GET    /questions/knowledge-point/:kpId    // 按知识点获取题目
POST   /questions/search                   // 搜索题目
POST   /questions/bulk-import              // 批量导入题目
GET    /questions/export                   // 导出题目
```

### 6. 练习管理模块 (PracticeModule)

#### 6.1 文件结构
```
src/practice/
├── practice.module.ts
├── practice.controller.ts
├── practice.service.ts
├── entities/
│   ├── practice-session.entity.ts
│   ├── practice-answer.entity.ts
│   └── practice-result.entity.ts
├── dto/
│   ├── start-practice.dto.ts
│   ├── submit-answer.dto.ts
│   └── practice-config.dto.ts
└── repositories/
    └── practice.repository.ts
```

#### 6.2 数据模型
```typescript
@Entity('practice_sessions')
export class PracticeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Subject)
  subject: Subject;

  @Column()
  subjectId: string;

  @Column({ type: 'json' })
  knowledgePointIds: string[];

  @Column({ type: 'json' })
  questionIds: string[];

  @Column({ type: 'json' })
  config: PracticeConfig;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ default: false })
  completed: boolean;

  @OneToMany(() => PracticeAnswer, answer => answer.session)
  answers: PracticeAnswer[];

  @OneToOne(() => PracticeResult, result => result.session)
  result: PracticeResult;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('practice_answers')
export class PracticeAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PracticeSession, session => session.answers)
  session: PracticeSession;

  @Column()
  sessionId: string;

  @ManyToOne(() => Question)
  question: Question;

  @Column()
  questionId: string;

  @Column({ type: 'json', nullable: true })
  answer: string | string[];

  @Column({ type: 'int', nullable: true })
  duration: number; // 答题用时(秒)

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'json', nullable: true })
  aiEvaluation: AIEvaluation;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('practice_results')
export class PracticeResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => PracticeSession, session => session.result)
  @JoinColumn()
  session: PracticeSession;

  @Column()
  sessionId: string;

  @Column({ type: 'int' })
  totalQuestions: number;

  @Column({ type: 'int' })
  correctAnswers: number;

  @Column({ type: 'int' })
  wrongAnswers: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  accuracy: number;

  @Column({ type: 'int' })
  totalDuration: number; // 总用时(秒)

  @Column({ type: 'json' })
  knowledgePointStats: KnowledgePointStats[];

  @CreateDateColumn()
  createdAt: Date;
}
```

#### 6.3 API端点
```typescript
POST   /practice/start                     // 开始练习
POST   /practice/:sessionId/answer         // 提交答案
POST   /practice/:sessionId/complete       // 完成练习
GET    /practice/sessions                  // 获取练习历史
GET    /practice/sessions/:id              // 获取练习详情
DELETE /practice/sessions/:id              // 删除练习记录
GET    /practice/stats                     // 获取练习统计
```

### 7. AI服务模块 (AIModule)

#### 7.1 文件结构
```
src/ai/
├── ai.module.ts
├── ai.controller.ts
├── ai.service.ts
├── providers/
│   ├── openai.provider.ts
│   ├── baidu.provider.ts
│   └── ai-factory.provider.ts
├── dto/
│   ├── evaluate-answer.dto.ts
│   ├── analyze-question.dto.ts
│   └── chat-message.dto.ts
└── interfaces/
    ├── ai-provider.interface.ts
    └── ai-evaluation.interface.ts
```

#### 7.2 主要功能
- **问答题评价**: 自动评分和分析
- **学习建议生成**: 基于学习数据的个性化建议
- **题目质量分析**: AI分析题目质量和改进建议
- **智能推荐**: 知识点和练习内容推荐
- **聊天助手**: 学习问题解答

#### 7.3 API端点
```typescript
POST   /ai/evaluate-answer                 // 评价问答题答案
POST   /ai/analyze-question                // 分析题目质量
POST   /ai/chat                           // AI聊天对话
POST   /ai/recommend-knowledge-points      // 推荐知识点
POST   /ai/generate-study-plan            // 生成学习计划
```

### 8. 分析统计模块 (AnalyticsModule)

#### 8.1 文件结构
```
src/analytics/
├── analytics.module.ts
├── analytics.controller.ts
├── analytics.service.ts
├── entities/
│   ├── user-analytics.entity.ts
│   └── knowledge-point-analytics.entity.ts
├── dto/
│   ├── analytics-query.dto.ts
│   └── analytics-report.dto.ts
└── jobs/
    └── analytics.processor.ts
```

#### 8.2 数据模型
```typescript
@Entity('user_analytics')
export class UserAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Subject)
  subject: Subject;

  @Column()
  subjectId: string;

  @Column({ type: 'int', default: 0 })
  totalPractices: number;

  @Column({ type: 'int', default: 0 })
  totalQuestions: number;

  @Column({ type: 'int', default: 0 })
  correctAnswers: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overallAccuracy: number;

  @Column({ type: 'int', default: 0 })
  totalStudyTime: number; // 总学习时间(分钟)

  @Column({ type: 'date' })
  lastPracticeDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('knowledge_point_analytics')
export class KnowledgePointAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => KnowledgePoint)
  knowledgePoint: KnowledgePoint;

  @Column()
  knowledgePointId: string;

  @Column({ type: 'int', default: 0 })
  practiceCount: number;

  @Column({ type: 'int', default: 0 })
  totalQuestions: number;

  @Column({ type: 'int', default: 0 })
  correctAnswers: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  accuracy: number;

  @Column({ type: 'enum', enum: MasteryLevel })
  masteryLevel: MasteryLevel;

  @Column({ type: 'date', nullable: true })
  lastPracticeDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 8.3 API端点
```typescript
GET    /analytics/user/:userId             // 获取用户分析数据
GET    /analytics/knowledge-points/:userId // 获取知识点分析
GET    /analytics/subject/:subjectId       // 获取学科统计
GET    /analytics/dashboard                // 获取仪表板数据
POST   /analytics/export                   // 导出分析报告
```

### 9. 文件管理模块 (FilesModule)

#### 9.1 文件结构
```
src/files/
├── files.module.ts
├── files.controller.ts
├── files.service.ts
├── entities/
│   └── file.entity.ts
├── dto/
│   └── upload-file.dto.ts
└── providers/
    ├── s3.provider.ts
    └── local.provider.ts
```

#### 9.2 主要功能
- **文件上传**: 支持图片、文档上传
- **文件存储**: 本地存储或云存储
- **文件管理**: 文件列表、删除、权限控制
- **批量导入**: Excel文件解析和批量导入

#### 9.3 API端点
```typescript
POST   /files/upload                       // 上传文件
GET    /files/:id                          // 获取文件
DELETE /files/:id                          // 删除文件
POST   /files/bulk-import/questions        // 批量导入题目
POST   /files/bulk-import/knowledge-points // 批量导入知识点
```

### 10. 通知模块 (NotificationsModule)

#### 10.1 文件结构
```
src/notifications/
├── notifications.module.ts
├── notifications.controller.ts
├── notifications.service.ts
├── entities/
│   └── notification.entity.ts
├── dto/
│   ├── create-notification.dto.ts
│   └── notification-query.dto.ts
└── jobs/
    └── notification.processor.ts
```

#### 10.2 主要功能
- **系统通知**: 学习提醒、成绩通知
- **实时推送**: WebSocket实时通知
- **邮件通知**: 重要事件邮件提醒
- **消息队列**: 异步处理通知发送

#### 10.3 API端点
```typescript
GET    /notifications                      // 获取通知列表
PUT    /notifications/:id/read             // 标记已读
DELETE /notifications/:id                  // 删除通知
POST   /notifications/mark-all-read        // 全部标记已读
```

---

## 🔧 共享模块设计

### 1. 数据库模块 (DatabaseModule)

#### 1.1 配置
```typescript
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

### 2. Redis模块 (RedisModule)

#### 2.1 配置
```typescript
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class RedisModule {}
```

### 3. 配置模块 (ConfigModule)

#### 3.1 环境变量
```typescript
// .env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=quiz_system

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# AI Services
OPENAI_API_KEY=your-openai-key
BAIDU_API_KEY=your-baidu-key
BAIDU_SECRET_KEY=your-baidu-secret

# File Storage
STORAGE_TYPE=local # local | s3 | oss
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

---

## 🚀 API设计规范

### 1. RESTful API设计

#### 1.1 HTTP状态码
- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器错误

#### 1.2 响应格式
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  path: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}
```

### 2. 错误处理

#### 2.1 全局异常过滤器
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    response.status(status).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 3. 数据验证

#### 3.1 DTO验证
```typescript
export class CreateQuestionDto {
  @IsEnum(QuestionType)
  @IsNotEmpty()
  type: QuestionType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  question: string;

  @ValidateIf(o => o.type !== 'essay')
  @IsObject()
  options?: QuestionOptions;

  @IsNotEmpty()
  answer: string | string[];

  @IsUUID()
  @IsNotEmpty()
  knowledgePointId: string;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel = 'medium';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];
}
```

---

## 🔐 安全设计

### 1. 认证安全
- **密码加密**: bcrypt哈希存储
- **JWT令牌**: 访问令牌 + 刷新令牌机制
- **会话管理**: Redis存储会话状态
- **登录限制**: 防暴力破解机制

### 2. 授权控制
- **角色权限**: RBAC权限模型
- **资源访问**: 基于所有权的访问控制
- **API限流**: 防止API滥用
- **CORS配置**: 跨域请求安全

### 3. 数据安全
- **输入验证**: 严格的DTO验证
- **SQL注入防护**: TypeORM参数化查询
- **XSS防护**: 输入输出过滤
- **敏感数据**: 加密存储和传输

---

## 📊 性能优化

### 1. 数据库优化
- **索引设计**: 关键字段建立索引
- **查询优化**: 避免N+1查询问题
- **连接池**: 数据库连接池配置
- **读写分离**: 主从数据库配置

### 2. 缓存策略
- **Redis缓存**: 热点数据缓存
- **查询缓存**: 复杂查询结果缓存
- **会话缓存**: 用户会话信息缓存
- **CDN**: 静态资源CDN加速

### 3. 异步处理
- **消息队列**: Bull Queue处理耗时任务
- **事件驱动**: 解耦业务逻辑
- **批量处理**: 批量数据操作优化

---

## 🧪 测试策略

### 1. 单元测试
```typescript
// 示例：用户服务测试
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should create a user', async () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.STUDENT,
    };

    const result = await service.create(createUserDto);
    expect(result).toBeDefined();
    expect(result.email).toBe(createUserDto.email);
  });
});
```

### 2. 集成测试
- **API端点测试**: 使用Supertest
- **数据库测试**: 使用测试数据库
- **外部服务测试**: Mock外部API

### 3. E2E测试
- **完整流程测试**: 用户注册到练习完成
- **权限测试**: 不同角色的访问权限
- **性能测试**: 并发用户和负载测试

---

## 📈 监控和日志

### 1. 日志系统
```typescript
// 日志配置
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

WinstonModule.forRoot({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
```

### 2. 健康检查
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }
}
```

### 3. 性能监控
- **APM工具**: 集成New Relic或DataDog
- **指标收集**: Prometheus + Grafana
- **错误追踪**: Sentry错误监控

---

## 🚀 部署架构

### 1. 容器化部署
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

### 2. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: quiz_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 3. 生产环境
- **负载均衡**: Nginx反向代理
- **数据库**: PostgreSQL主从配置
- **缓存**: Redis集群
- **监控**: 完整的监控体系

---

## 📋 开发计划

### Phase 1: 基础架构 (2周)
- [x] 项目初始化和基础配置
- [x] 数据库设计和实体定义
- [x] 认证授权模块
- [x] 用户管理模块

### Phase 2: 核心功能 (3周)
- [ ] 学科和知识点管理
- [ ] 题库管理模块
- [ ] 练习管理模块
- [ ] 基础API开发

### Phase 3: 高级功能 (2周)
- [ ] AI服务集成
- [ ] 分析统计模块
- [ ] 文件管理模块
- [ ] 通知系统

### Phase 4: 优化部署 (1周)
- [ ] 性能优化
- [ ] 安全加固
- [ ] 测试完善
- [ ] 部署配置

---

## 🔍 技术选型理由

### 1. NestJS框架
- **模块化架构**: 清晰的代码组织
- **TypeScript支持**: 类型安全和开发效率
- **装饰器模式**: 简洁的元数据编程
- **生态丰富**: 丰富的第三方库支持

### 2. PostgreSQL数据库
- **ACID特性**: 数据一致性保证
- **JSON支持**: 灵活的数据存储
- **性能优秀**: 复杂查询性能好
- **扩展性强**: 支持水平和垂直扩展

### 3. Redis缓存
- **高性能**: 内存存储，访问速度快
- **数据结构丰富**: 支持多种数据类型
- **持久化**: 数据持久化保证
- **集群支持**: 支持高可用部署

---

## 📚 参考资料

1. **NestJS官方文档**: https://docs.nestjs.com/
2. **TypeORM文档**: https://typeorm.io/
3. **PostgreSQL文档**: https://www.postgresql.org/docs/
4. **Redis文档**: https://redis.io/documentation
5. **JWT最佳实践**: https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/

---

**文档版本**: v1.0  
**创建日期**: 2025年1月  
**维护团队**: 后端开发团队  
**下次更新**: 根据开发进度和需求变更进行更新