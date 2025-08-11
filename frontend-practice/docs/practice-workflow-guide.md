# 自主练习功能实现指南 - 后端工程师指导文档

## 📋 文档信息

| 项目 | 智能练习测验系统 - 自主练习模块 |
|------|--------------------------------|
| 目标读者 | 后端工程师 |
| 文档类型 | 技术实现指南 |
| 版本 | v1.0 |
| 创建日期 | 2025年1月 |

---

## 🎯 功能概述

自主练习是系统的核心功能，允许学生自主选择知识点范围、配置练习参数、进行答题练习，并获得详细的学习分析。整个流程包括：学科选择 → 知识点选择 → 练习配置 → 答题练习 → 结果分析。

---

## 🔄 完整操作流程

### 流程图
```
用户登录 → 选择学科 → 知识点选择 → 练习配置 → 开始练习 → 答题过程 → 提交答案 → 结果分析 → 保存记录
```

### 关键决策点
1. **学科选择**: 确定练习的学科范围
2. **知识点选择**: 确定具体的练习内容
3. **练习配置**: 确定练习的方式和参数
4. **答题方式**: 根据题目类型采用不同的答题模式

---

## 📡 API接口设计

### 1. 学科管理接口

#### 1.1 获取学科列表
```http
GET /api/subjects
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "history",
      "name": "历史",
      "icon": "Scroll",
      "color": "bg-amber-500",
      "isActive": true,
      "description": "中学历史学科",
      "knowledgePointCount": 50,
      "questionCount": 500
    },
    {
      "id": "biology",
      "name": "生物",
      "icon": "Dna", 
      "color": "bg-green-500",
      "isActive": false,
      "description": "中学生物学科",
      "knowledgePointCount": 45,
      "questionCount": 300
    }
  ],
  "timestamp": "2025-01-20T10:30:00Z"
}
```

**后端实现要点**:
- 返回用户有权限访问的学科
- 包含学科的基本统计信息
- 标识学科的可用状态

### 2. 知识点管理接口

#### 2.1 获取学科知识点树
```http
GET /api/knowledge-points/tree/{subjectId}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "subjectId": "history",
    "tree": {
      "中外历史纲要上": {
        "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固": {
          "第1课 中华文明的起源与早期国家": {
            "第一子目 石器时代的古人类和文化遗存": [
              {
                "id": "HIST-1-1-1-1",
                "topic": "旧石器时代与新石器文明",
                "questionCount": 15,
                "lastPracticed": "2025-01-15T14:30:00Z"
              }
            ]
          }
        }
      }
    }
  }
}
```

**后端实现要点**:
- 按照5层结构组织数据：册→单元→课→子目→知识点
- 包含每个知识点的题目数量
- 记录用户最后练习时间
- 支持增量加载优化性能

#### 2.2 获取知识点详情
```http
GET /api/knowledge-points/{knowledgePointId}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "HIST-1-1-1-1",
    "subjectId": "history",
    "volume": "中外历史纲要上",
    "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
    "lesson": "第1课 中华文明的起源与早期国家",
    "section": "第一子目 石器时代的古人类和文化遗存",
    "topic": "旧石器时代与新石器文明",
    "description": "了解旧石器时代和新石器时代的特征...",
    "questionCount": 15,
    "userStats": {
      "totalPracticed": 8,
      "correctAnswers": 6,
      "accuracy": 75.0,
      "lastPracticed": "2025-01-15T14:30:00Z",
      "masteryLevel": "good"
    }
  }
}
```

### 3. 练习配置接口

#### 3.1 获取智能推荐配置
```http
POST /api/practice/smart-recommendation
```

**请求体**:
```json
{
  "userId": "user-123",
  "subjectId": "history",
  "preferredDuration": 20,
  "learningGoal": "review" | "strengthen" | "comprehensive"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "recommendationType": "weak-points-focus",
    "knowledgePoints": [
      "HIST-1-1-1-1",
      "HIST-1-2-1-1",
      "HIST-1-3-2-1"
    ],
    "config": {
      "questionType": "with-wrong",
      "questionCount": 15,
      "timeLimit": 1200,
      "shuffleQuestions": true,
      "showExplanation": true
    },
    "reasoning": "基于您的练习历史，这些知识点的准确率较低，建议重点练习",
    "expectedDuration": 18,
    "estimatedDifficulty": "medium"
  }
}
```

**后端实现要点**:
- 分析用户历史练习数据
- 识别薄弱知识点
- 根据时间限制推荐合适的题目数量
- 提供推荐理由增强用户信任

### 4. 练习会话管理接口

#### 4.1 创建练习会话
```http
POST /api/practice/sessions
```

**请求体**:
```json
{
  "userId": "user-123",
  "subjectId": "history",
  "knowledgePointIds": ["HIST-1-1-1-1", "HIST-1-2-1-1"],
  "config": {
    "questionType": "new",
    "questionCount": 20,
    "timeLimit": 1800,
    "shuffleQuestions": true,
    "showExplanation": true
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session-456",
    "questions": [
      {
        "id": "HIST-Q1",
        "type": "single-choice",
        "question": "长江流域是中华文明的发源地之一，能为以上认识提供的考古学证据是（ ）",
        "options": {
          "A": "仰韶文化 半坡遗址",
          "B": "红山文化 牛河梁遗址", 
          "C": "龙山文化 陶寺遗址",
          "D": "良渚文化 良渚古城遗址"
        },
        "relatedKnowledgePointId": "HIST-1-1-1-2",
        "difficulty": "medium",
        "estimatedTime": 90
      }
    ],
    "totalQuestions": 20,
    "estimatedDuration": 1800,
    "startTime": "2025-01-20T10:30:00Z",
    "expiresAt": "2025-01-20T11:00:00Z"
  }
}
```

**后端实现要点**:
- 根据配置筛选和组织题目
- 实现题目去重和难度平衡
- 支持题目顺序随机化
- 设置会话过期时间
- 记录会话创建时间

#### 4.2 提交单题答案
```http
POST /api/practice/sessions/{sessionId}/answers
```

**请求体**:
```json
{
  "questionId": "HIST-Q1",
  "answer": "D",
  "duration": 85,
  "timestamp": "2025-01-20T10:31:25Z"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctAnswer": "D",
    "explanation": "良渚文化良渚古城遗址位于长江流域，是中华文明起源的重要考古证据...",
    "knowledgePointInfo": {
      "id": "HIST-1-1-1-2",
      "topic": "中华文明起源的考古学证据",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固"
    },
    "nextQuestionId": "HIST-Q2"
  }
}
```

**后端实现要点**:
- 实时判断答案正误
- 记录答题时间和用户答案
- 返回详细的解析信息
- 更新用户知识点统计
- 提供下一题信息

#### 4.3 问答题AI评价
```http
POST /api/practice/sessions/{sessionId}/evaluate-essay
```

**请求体**:
```json
{
  "questionId": "BIO-Q1",
  "userAnswer": "细胞膜的结构特点主要包括磷脂双分子层结构...",
  "duration": 300
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "evaluation": {
      "overallScore": 8,
      "comparison": "您的答案与标准答案在核心要点上高度吻合...",
      "criteriaScores": {
        "结构描述": {
          "score": 8,
          "analysis": "您准确描述了主要结构组成，体现了扎实的基础知识。"
        },
        "功能分析": {
          "score": 7,
          "analysis": "主要功能已提及，但功能机制的阐述可以更深入。"
        }
      },
      "improvementSuggestions": [
        "答案内容可以更加充实，建议增加具体的例子和详细说明",
        "建议使用序号或逻辑词汇组织答案，使结构更加清晰"
      ]
    },
    "standardAnswer": "细胞膜的结构特点主要包括：...",
    "nextQuestionId": "BIO-Q2"
  }
}
```

**后端实现要点**:
- 集成AI服务（OpenAI/百度文心一言）
- 实现多维度评价算法
- 生成个性化改进建议
- 缓存AI评价结果
- 异步处理提高响应速度

#### 4.4 完成练习会话
```http
POST /api/practice/sessions/{sessionId}/complete
```

**请求体**:
```json
{
  "endTime": "2025-01-20T10:50:00Z",
  "completed": true
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session-456",
    "result": {
      "totalQuestions": 20,
      "answeredQuestions": 18,
      "correctAnswers": 15,
      "wrongAnswers": 3,
      "accuracy": 83.33,
      "completionRate": 90.0,
      "totalDuration": 1200,
      "averageTimePerQuestion": 66.67,
      "knowledgePointStats": [
        {
          "knowledgePointId": "HIST-1-1-1-1",
          "topic": "旧石器时代与新石器文明",
          "totalQuestions": 5,
          "correctAnswers": 4,
          "accuracy": 80.0,
          "masteryLevel": "good"
        }
      ]
    },
    "achievements": [
      {
        "type": "accuracy_milestone",
        "title": "准确率达人",
        "description": "单次练习准确率超过80%",
        "earnedAt": "2025-01-20T10:50:00Z"
      }
    ]
  }
}
```

### 5. 学习分析接口

#### 5.1 获取用户知识点分析
```http
GET /api/analytics/knowledge-points?userId={userId}&subjectId={subjectId}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalKnowledgePoints": 50,
      "practicedKnowledgePoints": 25,
      "overallAccuracy": 78.5,
      "totalPracticeTime": 1200,
      "practiceCount": 15
    },
    "knowledgePointStats": [
      {
        "id": "HIST-1-1-1-1",
        "volume": "中外历史纲要上",
        "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
        "lesson": "第1课 中华文明的起源与早期国家",
        "section": "第一子目 石器时代的古人类和文化遗存",
        "topic": "旧石器时代与新石器文明",
        "totalQuestions": 12,
        "correctAnswers": 9,
        "accuracy": 75.0,
        "practiceCount": 3,
        "lastPracticed": "2025-01-15T14:30:00Z",
        "masteryLevel": "good",
        "trend": "improving"
      }
    ],
    "weakPoints": [
      {
        "knowledgePointId": "HIST-1-2-1-1",
        "topic": "春秋五霸与政治变革",
        "accuracy": 45.0,
        "recommendedAction": "strengthen"
      }
    ]
  }
}
```

#### 5.2 AI学习助手对话
```http
POST /api/ai/chat
```

**请求体**:
```json
{
  "userId": "user-123",
  "subjectId": "history",
  "message": "我的薄弱点是什么？",
  "context": {
    "currentSession": "session-456",
    "recentPerformance": {
      "accuracy": 78.5,
      "weakPoints": ["HIST-1-2-1-1", "HIST-1-3-2-1"]
    }
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "response": "根据你的练习数据分析，你在以下知识点还需要加强：春秋五霸与政治变革、郡县制的推行。建议你重点复习这些内容，可以通过专项练习来提高掌握程度。",
    "suggestions": [
      {
        "type": "practice",
        "action": "strengthen_weak_points",
        "knowledgePoints": ["HIST-1-2-1-1", "HIST-1-3-2-1"],
        "estimatedTime": 15
      }
    ],
    "conversationId": "conv-789"
  }
}
```

---

## 🗄️ 数据库设计

### 核心表结构

#### 1. 练习会话表 (practice_sessions)
```sql
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id),
  knowledge_point_ids JSONB NOT NULL,
  config JSONB NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_subject_id ON practice_sessions(subject_id);
CREATE INDEX idx_practice_sessions_start_time ON practice_sessions(start_time);
```

#### 2. 练习答案表 (practice_answers)
```sql
CREATE TABLE practice_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id VARCHAR(50) NOT NULL,
  user_answer JSONB,
  is_correct BOOLEAN,
  duration INTEGER, -- 答题用时(秒)
  ai_evaluation JSONB, -- AI评价结果
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_practice_answers_session_id ON practice_answers(session_id);
CREATE INDEX idx_practice_answers_question_id ON practice_answers(question_id);
```

#### 3. 知识点统计表 (knowledge_point_analytics)
```sql
CREATE TABLE knowledge_point_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  knowledge_point_id VARCHAR(50) NOT NULL,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  practice_count INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE,
  mastery_level VARCHAR(20) DEFAULT 'poor',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, knowledge_point_id)
);

-- 索引
CREATE INDEX idx_kp_analytics_user_id ON knowledge_point_analytics(user_id);
CREATE INDEX idx_kp_analytics_mastery_level ON knowledge_point_analytics(mastery_level);
```

---

## 🔧 核心业务逻辑

### 1. 题目筛选算法

#### 1.1 根据配置筛选题目
```typescript
interface QuestionFilterService {
  async filterQuestions(params: {
    knowledgePointIds: string[];
    questionType: 'new' | 'with-wrong' | 'wrong-only';
    userId: string;
    questionCount: number | 'unlimited';
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<QuizQuestion[]>;
}

// 实现逻辑
class QuestionFilterServiceImpl implements QuestionFilterService {
  async filterQuestions(params) {
    // 1. 获取知识点相关的所有题目
    let questions = await this.getQuestionsByKnowledgePoints(params.knowledgePointIds);
    
    // 2. 根据题目类型筛选
    if (params.questionType === 'wrong-only') {
      // 只包含用户答错的题目
      const wrongQuestionIds = await this.getUserWrongQuestions(params.userId);
      questions = questions.filter(q => wrongQuestionIds.includes(q.id));
    } else if (params.questionType === 'new') {
      // 只包含用户未做过的题目
      const answeredQuestionIds = await this.getUserAnsweredQuestions(params.userId);
      questions = questions.filter(q => !answeredQuestionIds.includes(q.id));
    }
    // 'with-wrong' 包含所有题目，不需要额外筛选
    
    // 3. 难度筛选
    if (params.difficulty) {
      questions = questions.filter(q => q.difficulty === params.difficulty);
    }
    
    // 4. 随机排序和数量限制
    questions = this.shuffleArray(questions);
    if (typeof params.questionCount === 'number') {
      questions = questions.slice(0, params.questionCount);
    }
    
    return questions;
  }
}
```

### 2. 实时统计更新

#### 2.1 答题后统计更新
```typescript
class AnalyticsService {
  async updateKnowledgePointStats(params: {
    userId: string;
    questionId: string;
    isCorrect: boolean;
    duration: number;
  }) {
    // 1. 获取题目关联的知识点
    const question = await this.questionsService.findById(params.questionId);
    const knowledgePointId = question.relatedKnowledgePointId;
    
    // 2. 更新或创建知识点统计
    await this.knowledgePointAnalyticsRepository.upsert({
      userId: params.userId,
      knowledgePointId: knowledgePointId,
      totalQuestions: () => 'total_questions + 1',
      correctAnswers: () => params.isCorrect ? 'correct_answers + 1' : 'correct_answers',
      accuracy: () => 'ROUND((correct_answers::DECIMAL / total_questions) * 100, 2)',
      practiceCount: () => 'practice_count + 1',
      lastPracticed: new Date(),
      masteryLevel: () => this.calculateMasteryLevel()
    });
    
    // 3. 更新用户总体统计
    await this.updateUserOverallStats(params.userId);
  }
  
  private calculateMasteryLevel(): string {
    return `
      CASE 
        WHEN accuracy >= 90 THEN 'excellent'
        WHEN accuracy >= 75 THEN 'good'
        WHEN accuracy >= 60 THEN 'needs-improvement'
        ELSE 'poor'
      END
    `;
  }
}
```

### 3. AI评价服务

#### 3.1 问答题评价实现
```typescript
class AIEvaluationService {
  async evaluateEssayAnswer(params: {
    question: QuizQuestion;
    userAnswer: string;
    userId: string;
  }): Promise<AIEvaluation> {
    // 1. 构建AI评价提示词
    const prompt = this.buildEvaluationPrompt(params.question, params.userAnswer);
    
    // 2. 调用AI服务
    const aiResponse = await this.aiProvider.generateCompletion({
      prompt,
      maxTokens: 1000,
      temperature: 0.3
    });
    
    // 3. 解析AI响应
    const evaluation = this.parseAIEvaluation(aiResponse);
    
    // 4. 缓存评价结果
    await this.cacheEvaluation(params.question.id, params.userAnswer, evaluation);
    
    return evaluation;
  }
  
  private buildEvaluationPrompt(question: QuizQuestion, userAnswer: string): string {
    return `
      请评价以下问答题的学生答案：
      
      题目：${question.question}
      标准答案：${question.standardAnswer}
      学生答案：${userAnswer}
      
      评价标准：${JSON.stringify(question.evaluationCriteria)}
      
      请按照以下格式返回评价结果：
      1. 总分（1-10分）
      2. 与标准答案的对比分析
      3. 各维度评分和分析
      4. 具体改进建议
    `;
  }
}
```

---

## 🚀 性能优化策略

### 1. 缓存策略

#### 1.1 Redis缓存设计
```typescript
// 缓存键设计
const CACHE_KEYS = {
  SUBJECT_LIST: 'subjects:all',
  KNOWLEDGE_POINTS: (subjectId: string) => `knowledge_points:${subjectId}`,
  USER_STATS: (userId: string, subjectId: string) => `user_stats:${userId}:${subjectId}`,
  QUESTIONS: (kpIds: string[]) => `questions:${kpIds.sort().join(',')}`,
  AI_EVALUATION: (questionId: string, answerHash: string) => `ai_eval:${questionId}:${answerHash}`
};

// 缓存实现
class CacheService {
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number = 3600): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const data = await fetcher();
    await this.redis.setex(key, ttl, JSON.stringify(data));
    return data;
  }
}
```

#### 1.2 缓存更新策略
- **学科和知识点**: 长期缓存（24小时），管理员更新时清除
- **用户统计**: 中期缓存（1小时），答题后更新
- **题目数据**: 中期缓存（2小时），题库更新时清除
- **AI评价**: 永久缓存，相同答案直接返回缓存结果

### 2. 数据库优化

#### 2.1 查询优化
```sql
-- 获取用户知识点统计的优化查询
SELECT 
  kp.id,
  kp.volume,
  kp.unit,
  kp.lesson,
  kp.section,
  kp.topic,
  COALESCE(kpa.total_questions, 0) as total_questions,
  COALESCE(kpa.correct_answers, 0) as correct_answers,
  COALESCE(kpa.accuracy, 0) as accuracy,
  COALESCE(kpa.mastery_level, 'poor') as mastery_level,
  kpa.last_practiced
FROM knowledge_points kp
LEFT JOIN knowledge_point_analytics kpa ON kp.id = kpa.knowledge_point_id 
  AND kpa.user_id = $1
WHERE kp.subject_id = $2
ORDER BY kp.volume, kp.unit, kp.lesson, kp.section, kp.topic;
```

#### 2.2 索引策略
```sql
-- 复合索引优化查询性能
CREATE INDEX idx_practice_answers_session_question ON practice_answers(session_id, question_id);
CREATE INDEX idx_kp_analytics_user_subject ON knowledge_point_analytics(user_id, knowledge_point_id);
CREATE INDEX idx_questions_knowledge_point ON questions(related_knowledge_point_id);
```

---

## 🔐 安全考虑

### 1. 数据访问控制
```typescript
// 权限检查装饰器
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student', 'teacher')
@Controller('practice')
export class PracticeController {
  @Post('sessions')
  async createSession(
    @CurrentUser() user: User,
    @Body() createSessionDto: CreateSessionDto
  ) {
    // 确保用户只能创建自己的练习会话
    return this.practiceService.createSession(user.id, createSessionDto);
  }
}
```

### 2. 数据验证
```typescript
// DTO验证
export class CreateSessionDto {
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  knowledgePointIds: string[];

  @ValidateNested()
  @Type(() => PracticeConfigDto)
  config: PracticeConfigDto;
}

export class PracticeConfigDto {
  @IsEnum(['new', 'with-wrong', 'wrong-only'])
  questionType: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  questionCount?: number;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(7200)
  timeLimit?: number;

  @IsBoolean()
  shuffleQuestions: boolean;

  @IsBoolean()
  showExplanation: boolean;
}
```

---

## 📊 监控和日志

### 1. 关键指标监控
```typescript
// 业务指标
interface PracticeMetrics {
  sessionCreationRate: number;      // 会话创建率
  sessionCompletionRate: number;    // 会话完成率
  averageSessionDuration: number;   // 平均会话时长
  averageAccuracy: number;          // 平均准确率
  aiEvaluationLatency: number;      // AI评价延迟
  questionLoadTime: number;         // 题目加载时间
}

// 监控实现
@Injectable()
export class MetricsService {
  async recordSessionMetrics(sessionId: string, metrics: Partial<PracticeMetrics>) {
    // 记录到时序数据库或监控系统
    await this.metricsCollector.record('practice_session', metrics, {
      sessionId,
      timestamp: new Date()
    });
  }
}
```

### 2. 错误处理和日志
```typescript
// 全局异常过滤器
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // 记录错误日志
    this.logger.error('API Error', {
      url: request.url,
      method: request.method,
      error: exception,
      userId: request.user?.id,
      timestamp: new Date()
    });

    // 返回标准错误响应
    response.status(status).json({
      success: false,
      error: this.getErrorMessage(exception),
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}
```

---

## 🧪 测试策略

### 1. 单元测试
```typescript
describe('PracticeService', () => {
  describe('createSession', () => {
    it('should create practice session with correct configuration', async () => {
      const createSessionDto = {
        subjectId: 'history',
        knowledgePointIds: ['HIST-1-1-1-1'],
        config: {
          questionType: 'new',
          questionCount: 10,
          shuffleQuestions: true,
          showExplanation: true
        }
      };

      const result = await service.createSession('user-123', createSessionDto);
      
      expect(result.questions).toHaveLength(10);
      expect(result.sessionId).toBeDefined();
      expect(result.startTime).toBeDefined();
    });
  });
});
```

### 2. 集成测试
```typescript
describe('Practice Workflow (e2e)', () => {
  it('should complete full practice workflow', async () => {
    // 1. 创建练习会话
    const session = await request(app)
      .post('/api/practice/sessions')
      .send(createSessionDto)
      .expect(201);

    // 2. 提交答案
    for (const question of session.body.data.questions) {
      await request(app)
        .post(`/api/practice/sessions/${session.body.data.sessionId}/answers`)
        .send({
          questionId: question.id,
          answer: question.answer,
          duration: 60
        })
        .expect(200);
    }

    // 3. 完成会话
    const result = await request(app)
      .post(`/api/practice/sessions/${session.body.data.sessionId}/complete`)
      .send({ endTime: new Date(), completed: true })
      .expect(200);

    expect(result.body.data.result.accuracy).toBeGreaterThan(0);
  });
});
```

---

## 📋 实施检查清单

### 开发阶段
- [ ] 实现所有核心API接口
- [ ] 完成数据库表结构设计
- [ ] 实现题目筛选算法
- [ ] 集成AI评价服务
- [ ] 实现实时统计更新
- [ ] 添加缓存层
- [ ] 实现错误处理和日志

### 测试阶段
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试覆盖主要流程
- [ ] 性能测试（并发用户、响应时间）
- [ ] 安全测试（权限控制、数据验证）

### 部署阶段
- [ ] 数据库迁移脚本
- [ ] 环境配置文件
- [ ] 监控和告警设置
- [ ] 备份和恢复策略

---

## 🔍 常见问题和解决方案

### Q1: 如何处理大量并发的练习会话？
**A**: 使用Redis存储会话状态，数据库只存储最终结果。实现会话池和连接池优化。

### Q2: AI评价服务响应慢怎么办？
**A**: 实现异步评价机制，先返回题目结果，AI评价完成后通过WebSocket推送。

### Q3: 如何保证题目筛选的公平性？
**A**: 实现加权随机算法，考虑题目难度分布和用户历史表现。

### Q4: 数据一致性如何保证？
**A**: 使用数据库事务，关键操作实现幂等性，定期数据校验。

---

**文档版本**: v1.0  
**创建日期**: 2025年1月  
**维护团队**: 后端开发团队  
**下次更新**: 根据开发进度和需求变更进行更新