# Quiz Explanation Feature Design Document (Revised)
# 题目解析功能设计文档（修订版）

## 1. 背景与目标 / Background & Goals

### Problem Context / 问题背景
Currently, when students answer quiz questions incorrectly during practice sessions, they only receive feedback on whether their answer was correct or incorrect, along with the correct answer. This limited feedback loop misses a valuable teaching opportunity to explain **why** an answer is correct and help students understand the underlying concepts.

当前学生在练习时答错题目后，仅能看到答案是否正确以及正确答案。这种有限的反馈错失了宝贵的教学机会，无法解释**为什么**答案是正确的，也无法帮助学生理解背后的概念。

### Motivation / 动机
- Students often memorize answers without understanding the reasoning
- Teachers want to provide additional context and teaching points
- Self-study effectiveness is reduced without proper explanations
- Knowledge retention improves with immediate, contextual explanations

### Objectives / 目标
- **Reuse existing APIs**: Extend current quiz submission and update APIs with explanation field
- **Enable teacher-authored explanations**: Allow teachers to add explanations when creating/editing quizzes
- **Seamless integration**: Include explanations in normal quiz retrieval flow
- **Conditional display**: Frontend controls when to show explanations (on wrong answers)
- **Maintain simplicity**: Keep the feature optional and backward-compatible

## 2. 参与角色 / System Actors

| Role / 角色 | Responsibility / 职责 | Key Actions / 主要操作 |
|-------------|----------------------|------------------------|
| **Teacher / 教师** | Content creator and curator | • Add/edit quiz explanations<br>• Review and update explanations<br>• Control explanation visibility settings |
| **Student / 学生** | Content consumer and learner | • View explanations after incorrect answers<br>• Review explanations in practice history<br>• Request explanations (future) |
| **Platform / 平台** | System orchestrator | • Store and retrieve explanations<br>• Apply display rules<br>• Track explanation usage metrics |
| **Admin / 管理员** | System configuration | • Configure default explanation settings<br>• Monitor explanation quality<br>• Manage feature availability |

## 3. 工作流程概述 / Workflow Overview

### 3.1 Teacher Creates/Edits Quiz with Explanation
**Phase**: Content Creation
**Actor**: Teacher

```typescript
// Using EXISTING POST /v1/quiz/submit endpoint - just add explanation field
POST /v1/quiz/submit
{
  "quiz": {
    "type": "fill-in-the-blank",
    "question": "The capital of France is ____.",
    "answer": "Paris",
    "explanation": "Paris has been the capital of France since 987 AD, when Hugh Capet became King of France. It's located on the Seine River in northern France.",
    "knowledge_point_id": "geo-europe-capitals"
  }
}

// Or batch submission with explanations
POST /v1/quiz/submit-multiple
{
  "quizzes": [
    {
      "type": "single-choice",
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "answer": "Paris",
      "explanation": "Paris has been France's capital since 987 AD...",
      "knowledge_point_id": "geo-europe-capitals"
    }
  ]
}
```

**Responsibilities**:
- Teacher: Writes clear, educational explanations
- Platform: Stores explanation as part of quiz data

### 3.2 Student Gets Quiz with Explanation
**Phase**: Quiz Retrieval
**Actor**: Student/Frontend

```typescript
// Using EXISTING GET endpoints - explanation included automatically
GET /v1/quiz/123
// or
GET /v1/quiz?knowledge_point_id=geo-europe-capitals

// Response ALWAYS includes explanation field
{
  "success": true,
  "data": {
    "id": "123",
    "type": "fill-in-the-blank",
    "question": "The capital of France is ____.",
    "answer": "Paris",
    "explanation": "Paris has been the capital of France since 987 AD...",
    "knowledge_point_id": "geo-europe-capitals"
  }
}
```

**Responsibilities**:
- Platform: Always returns explanation with quiz data
- Frontend: Decides when to display explanation based on answer correctness

### 3.3 Frontend Display Logic
**Phase**: User Interface
**Actor**: Frontend Application

```typescript
// Frontend decides when to show explanation
function handleAnswerSubmission(userAnswer: string, quiz: QuizItem) {
  const isCorrect = checkAnswer(userAnswer, quiz.answer);
  
  // Show explanation only when wrong (or based on user preference)
  const showExplanation = !isCorrect && quiz.explanation;
  
  return {
    correct: isCorrect,
    correctAnswer: quiz.answer,
    explanation: showExplanation ? quiz.explanation : undefined,
    // Frontend controls visibility, not backend
  };
}
```

**Responsibilities**:
- Frontend: Controls when to display explanations
- Student: Reads explanation when shown after incorrect answer

### 3.4 Teacher Updates Quiz Explanation
**Phase**: Content Management
**Actor**: Teacher

```typescript
// Using EXISTING PUT /v1/quiz/:id endpoint - explanation is just another field
PUT /v1/quiz/123
{
  "quiz": {
    "explanation": "Updated: Paris, known as 'City of Light', became France's capital in 987 AD under Hugh Capet. The city spans both banks of the Seine River in northern France and is home to iconic landmarks like the Eiffel Tower."
    // Can update explanation alone or with other fields
  }
}
```

**Responsibilities**:
- Teacher: Updates explanation as needed
- Platform: Updates quiz record including explanation field

## 4. 数据结构 / Structures

### 4.1 Updated Quiz Schema

```typescript
// Simply extend existing QuizItemSchema in quiz-item.schema.ts
export const QuizItemSchema = z.object({
  id: z.string().optional(),
  type: QuizTypeSchema,
  question: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.union([
    z.string(),
    z.array(z.string()),
    z.array(z.number())
  ]).optional(),
  images: z.array(z.string()).optional(),
  originalParagraph: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  knowledge_point_id: z.string().nullable().optional(),
  alternative_answers: z.array(z.string()).optional().default([]),
  
  // NEW FIELD - Simple addition to existing schema
  explanation: z.string().optional().nullable(),
  
  knowledgePoint: z.object({
    id: z.string(),
    topic: z.string(),
    volume: z.string().optional(),
    unit: z.string().optional(),
    lesson: z.string().optional(),
  }).nullable().optional(),
});
```

### 4.2 Database Migration

```sql
-- Simple migration: Add single explanation column to existing table
ALTER TABLE kedge_practice.quizzes 
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Optional: Add index for filtering quizzes with explanations
CREATE INDEX IF NOT EXISTS idx_quizzes_has_explanation 
ON kedge_practice.quizzes((explanation IS NOT NULL));
```

### 4.3 No Changes to Existing APIs

The beauty of this design is that **NO NEW APIs are needed**:

1. **Quiz Submission** (`POST /v1/quiz/submit`, `POST /v1/quiz/submit-multiple`):
   - Already accepts `quiz` object - just add `explanation` field to it
   - Existing validation with `QuizItemSchema.parse()` will handle the new field

2. **Quiz Retrieval** (`GET /v1/quiz/:id`, `GET /v1/quiz`):
   - Automatically returns explanation field as part of quiz data
   - No code changes needed, database column maps to object property

3. **Quiz Update** (`PUT /v1/quiz/:id`):
   - Already accepts partial quiz updates
   - Can update explanation along with other fields

4. **Practice APIs** remain unchanged:
   - Frontend receives full quiz data including explanation
   - Frontend decides when to show based on correctness

## 5. 安全与正确性保障 / Security & Correctness

| Mechanism / 机制 | Description / 描述 | Risk Prevention / 风险防范 |
|------------------|-------------------|---------------------------|
| **Input Sanitization** | Sanitize explanation HTML/Markdown content | Prevents XSS attacks through malicious explanation content |
| **Access Control** | Role-based permissions for explanation editing | Ensures only authorized teachers can modify explanations |
| **Content Validation** | Length limits (max 2000 chars) and format checks | Prevents database bloat and ensures consistent display |
| **Rate Limiting** | Limit explanation view requests per session | Prevents API abuse and unnecessary server load |
| **Audit Logging** | Track all explanation modifications | Enables accountability and rollback capabilities |
| **Version Control** | Store explanation history | Allows recovery from accidental deletions or bad edits |
| **Display Rules Engine** | Server-side control of when explanations show | Prevents client-side bypassing of learning flow |
| **Content Moderation** | Flag system for inappropriate explanations | Maintains educational quality and appropriateness |

## 6. 接口摘要 / Interface Summary

**NO NEW APIS REQUIRED** - We reuse all existing endpoints:

| Existing API / 现有接口 | How It Handles Explanations / 解析处理 | Caller / 调用者 | Method |
|-------------------------|----------------------------------------|-----------------|---------|
| `/quiz/submit` | Add `explanation` field to quiz object | Teacher | POST |
| `/quiz/submit-multiple` | Add `explanation` field to each quiz | Teacher | POST |
| `/quiz/{id}` | Returns quiz with explanation field | Student/Teacher | GET |
| `/quiz` | Returns quizzes with explanation fields | Student/Teacher | GET |
| `/quiz/{id}` | Update explanation via quiz object | Teacher | PUT |
| `/practice/submit-answer` | Frontend shows explanation based on correctness | Student | POST |
| `/practice/session/{id}/answers` | Includes quiz data with explanations | Student | GET |

## 7. 示例 / Example

### 7.1 Creating Quiz with Explanation (Using Existing API)

```json
// POST /v1/quiz/submit-multiple (EXISTING ENDPOINT)
{
  "quizzes": [
    {
      "type": "fill-in-the-blank",
      "question": "中国四大发明包括____、____、____和____。",
      "answer": ["造纸术", "印刷术", "火药", "指南针"],
      "explanation": "中国古代四大发明是造纸术、印刷术、火药和指南针。这些发明对世界文明发展产生了深远影响：\n\n• 造纸术（东汉，蔡伦改进）：促进了知识传播\n• 印刷术（北宋，毕昇发明活字印刷）：加速了文化交流\n• 火药（唐朝）：改变了战争形式\n• 指南针（战国司南→宋朝罗盘）：推动了航海大发现\n\n记忆口诀：'纸印火针'",
      "knowledge_point_id": "history-ancient-china-inventions",
      "alternative_answers": [["纸", "印刷", "火药", "指南针"]]
    }
  ]
}
```

### 7.2 Getting Quiz Always Returns Explanation

```json
// GET /v1/quiz/quiz_101 (EXISTING ENDPOINT)
{
  "success": true,
  "data": {
    "id": "quiz_101",
    "type": "fill-in-the-blank",
    "question": "中国四大发明包括____、____、____和____。",
    "answer": ["造纸术", "印刷术", "火药", "指南针"],
    "explanation": "中国古代四大发明是造纸术、印刷术、火药和指南针...",
    "knowledge_point_id": "history-ancient-china-inventions",
    "alternative_answers": [["纸", "印刷", "火药", "指南针"]]
  }
}
```

### 7.3 Frontend Handles Display Logic

```typescript
// Frontend code example (not an API)
function QuizPractice({ quiz, userAnswer, isCorrect }) {
  // Frontend decides when to show explanation
  const shouldShowExplanation = !isCorrect && quiz.explanation;
  
  return (
    <div>
      <div className="answer-feedback">
        {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
        <div>Correct answer: {quiz.answer}</div>
      </div>
      
      {/* Only show explanation when answer is wrong */}
      {shouldShowExplanation && (
        <div className="explanation-panel">
          <h4>💡 Explanation</h4>
          <p>{quiz.explanation}</p>
        </div>
      )}
    </div>
  );
}
```

### 7.4 Updating Quiz Explanation

```json
// PUT /v1/quiz/quiz_101 (EXISTING ENDPOINT)
{
  "quiz": {
    "explanation": "中国古代四大发明是造纸术、印刷术、火药和指南针。\n\n更详细的解释：\n• 造纸术 - 东汉蔡伦改进，使知识传播更容易\n• 印刷术 - 北宋毕昇发明活字印刷，大大提高了书籍生产效率\n• 火药 - 唐朝炼丹术的副产品，改变了战争形态\n• 指南针 - 从战国司南演变而来，促进了地理大发现\n\n记忆技巧：可以记为'纸印火针'，按时间顺序排列。"
  }
}
```

## 8. 设计权衡 / Design Tradeoffs

| Approach / 方案 | Advantages ✅ | Disadvantages ⛔ | Decision / 决策 |
|-----------------|---------------|------------------|-----------------|
| **Reuse Existing APIs** | • No new endpoints<br>• Minimal code changes<br>• Backward compatible<br>• Fast implementation | • Less flexibility<br>• Coupled to quiz model | ✅ **Selected** - Simplicity & speed |
| **Create New APIs** | • Clean separation<br>• More flexibility<br>• Independent versioning | • More code<br>• More testing<br>• Duplication<br>• Maintenance burden | ⛔ Unnecessary complexity |
| **Store in Quiz Table** | • Simple schema<br>• Single source of truth<br>• Easy backup<br>• No joins needed | • Table size growth<br>• One migration needed | ✅ **Selected** - Simplicity wins |
| **Separate Table** | • Flexible schema<br>• Version history<br>• Multi-language | • Join complexity<br>• Sync issues<br>• More code | ⛔ Over-engineering |
| **Frontend Controls Display** | • No backend changes<br>• Flexible UI logic<br>• User preferences | • Client must handle logic<br>• Consistency across apps | ✅ **Selected** - Clean separation |
| **Backend Controls Display** | • Centralized logic<br>• Consistent behavior | • API changes<br>• Less flexible<br>• More complexity | ⛔ Unnecessary coupling |
| **Plain Text Only** | • Simple<br>• Safe<br>• Fast | • No formatting<br>• Poor readability | ⛔ Too limited |
| **Markdown Support** | • Rich text<br>• Safe rendering<br>• Standard format | • Parse overhead<br>• Sanitization | ✅ **Future enhancement** |

### Key Design Decisions (Revised)

1. **Reuse Existing Infrastructure**: No new APIs - explanation is just another quiz field
2. **Minimal Changes**: Only need to:
   - Add one column to database
   - Add one field to QuizItemSchema
   - Update frontend to conditionally show explanations
3. **Frontend Display Control**: Let frontend decide when to show based on correctness
4. **Backward Compatible**: Old quizzes without explanations work fine (field is optional)
5. **Simple Implementation Path**: Can be implemented incrementally

### Implementation Steps

1. **Backend (Minimal Changes)**:
   ```bash
   # Step 1: Add migration
   hasura migrate create add_explanation_to_quizzes --from-server
   
   # Step 2: Update schema
   # Add `explanation: z.string().optional().nullable()` to QuizItemSchema
   
   # Step 3: Rebuild to verify types
   nx run-many --target=build --all
   ```

2. **Frontend**:
   - Update quiz display component to show explanation when answer is wrong
   - Add explanation field to teacher's quiz creation/edit forms
   - Store user preference for showing explanations

3. **Testing**:
   - Test quiz submission with explanation
   - Test quiz retrieval includes explanation
   - Test update quiz explanation
   - Test frontend display logic

### Future Enhancements

- **Rich Text**: Upgrade from plain text to Markdown
- **AI Generation**: Auto-generate explanations for existing quizzes
- **Analytics**: Track explanation effectiveness
- **Multimedia**: Support images/videos in explanations
- **Personalization**: Adjust explanation detail by student level