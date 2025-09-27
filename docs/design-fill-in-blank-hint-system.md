# Fill-in-the-Blank Hint System Design Document

## Executive Summary

This document outlines the design and implementation of a hint system for fill-in-the-blank quiz questions to enhance the user learning experience. The system will provide contextual hints (e.g., "人名", "地名", "年份") directly after blanks to guide students without revealing the answer, making the practice more educational and less frustrating.

## 1. Feature Overview

### 1.1 Problem Statement

Currently, fill-in-the-blank questions can be challenging for students when they lack context about what type of answer is expected. For example:
- "____统一了六国" - Students may not know if this requires a person's name, dynasty, or year
- "中国的首都是____" - Could be looking for current or historical capital

### 1.2 Solution

Implement an intelligent hint system that:
- Provides contextual hints after blanks: `____(人名)`, `____(地名)`, `____(年份)`
- Auto-generates hints using AI during quiz creation
- Allows manual hint editing by teachers
- Enables students to toggle hint visibility during practice

### 1.3 Success Metrics

- Reduced answer abandonment rate by 30%
- Improved first-attempt accuracy by 20%
- Enhanced user satisfaction scores
- Increased practice session completion rates

## 2. Data Model Design

### 2.1 Schema Changes

#### Current Quiz Item Schema
```typescript
export const QuizItemSchema = z.object({
  id: z.string().optional(),
  type: QuizTypeSchema,
  question: z.string(),
  answer: z.union([z.string(), z.array(z.string())]),
  // ... existing fields
});
```

#### Enhanced Quiz Item Schema (Simple Addition)
```typescript
export const QuizItemSchema = z.object({
  id: z.string().optional(),
  type: QuizTypeSchema,
  question: z.string(),
  answer: z.union([z.string(), z.array(z.string())]),
  hints: z.array(z.string().nullable()).optional(), // NEW: Array of hints for fill-in-blank
  // ... existing fields
});
```

#### Design Principle
- **Simplicity**: Hints are just another field in the quiz data model
- **Integrated Generation**: GPT generates hints along with questions in a single call
- **No Metadata Tracking**: No need to track whether hints are auto-generated or manual - they're all part of the quiz content
- **Teacher Control**: Teachers can edit hints just like they edit questions or answers

#### Hint Handling Rules
- **Null values**: Indicate no hint for that blank position
- **Empty strings**: Treated as null (no hint) after trimming
- **Position mapping**: Array index directly corresponds to blank position (0-indexed)
- **Example**: For "____年，____统一了六国", hints could be `[null, "人名"]` or `["", "人名"]`

### 2.2 Database Migration

```sql
-- Migration: Add hints to quizzes table
ALTER TABLE kedge_practice.quizzes 
ADD COLUMN hints JSONB DEFAULT NULL;

-- Index for efficient hint queries (e.g., finding quizzes with/without hints)
CREATE INDEX idx_quizzes_hints ON kedge_practice.quizzes USING GIN (hints);
```

### 2.3 Hint Categories (History-Focused)

Standard hint types optimized for middle school history education:

#### 时间类 (Time)
- `年份` - 具体年份 (如: 1949)
- `朝代` - 朝代名称 (如: 唐朝、宋朝)
- `世纪` - 世纪 (如: 19世纪)
- `时期` - 历史时期 (如: 春秋时期、战国时期)
- `年代` - 年代范围 (如: 20世纪30年代)

#### 人物类 (People)
- `人名` - 历史人物姓名 (如: 秦始皇、孔子)
- `皇帝` - 帝王称号 (如: 汉武帝、唐太宗)
- `领袖` - 领导人物 (如: 毛泽东、孙中山)
- `思想家` - 思想家/哲学家 (如: 老子、孟子)
- `将领` - 军事将领 (如: 岳飞、戚继光)

#### 地理类 (Geography)
- `地名` - 地理名称 (如: 长安、洛阳)
- `国家` - 国家名称 (如: 齐国、楚国)
- `都城` - 都城名称 (如: 北京、南京)
- `地区` - 区域名称 (如: 中原、江南)
- `关隘` - 关口要塞 (如: 山海关、嘉峪关)

#### 事件类 (Events)
- `战争` - 战争名称 (如: 赤壁之战、鸦片战争)
- `事件` - 历史事件 (如: 五四运动、辛亥革命)
- `条约` - 条约名称 (如: 南京条约、马关条约)
- `改革` - 改革运动 (如: 戊戌变法、洋务运动)
- `起义` - 起义名称 (如: 太平天国、义和团)

#### 文化类 (Culture)
- `著作` - 书籍作品 (如: 《史记》、《资治通鉴》)
- `发明` - 科技发明 (如: 造纸术、火药)
- `制度` - 制度名称 (如: 科举制、郡县制)
- `学派` - 学派思想 (如: 儒家、法家)
- `文物` - 文物器具 (如: 青铜器、瓷器)

#### 其他类 (Others)
- `数字` - 数量数字 (如: 三、七)
- `称号` - 称号头衔 (如: 丞相、太守)
- `民族` - 民族名称 (如: 匈奴、鲜卑)
- `王朝` - 王朝名称 (如: 西汉、东晋)
- `组织` - 组织机构 (如: 同盟会、共产党)

## 3. Backend Implementation

### 3.1 API Changes (Minimal)

#### No New Endpoints Needed
The existing quiz endpoints automatically support the new hints field:

```typescript
// All existing endpoints work with hints out of the box
POST /v1/quiz/submit
POST /v1/quiz/submit-multiple  
POST /v1/quiz/submit-with-images
PUT /v1/quiz/:id
GET /v1/quiz/:id
GET /v1/quiz

// Example request with hints
POST /v1/quiz/submit
{
  type: "fill-in-the-blank",
  question: "____统一了六国，建立了中国第一个统一的____朝代。",
  answer: ["秦始皇", "秦"],
  hints: ["人名", "朝代名"],  // NEW: Optional field
  knowledge_point_id: "xxx"
}

// Example update request
PUT /v1/quiz/:id
{
  hints: ["历史人物", "朝代名"]  // Can update hints like any other field
}
```

#### Migration Handled Separately
- Existing fill-in-blank quizzes will be migrated via a separate script
- No API endpoint needed for batch operations
- Keeps the API surface clean and simple

### 3.2 Service Layer Changes (Minimal)

#### Quiz Service Enhancement (`@kedge/quiz/quiz.service.ts`)
```typescript
@Injectable()
export class QuizService {
  constructor(
    private readonly quizRepository: QuizRepository
  ) {}

  /**
   * Normalizes hint array by converting empty strings to null
   */
  private normalizeHints(hints?: (string | null)[]): (string | null)[] | undefined {
    if (!hints) return undefined;
    
    return hints.map(hint => {
      if (typeof hint === 'string' && hint.trim() === '') {
        return null;
      }
      return hint;
    });
  }

  async createQuiz(data: CreateQuizDto): Promise<Quiz> {
    // Normalize hints if provided (for fill-in-blank questions)
    if (data.type === 'fill-in-the-blank' && data.hints) {
      data.hints = this.normalizeHints(data.hints);
    }
    
    return this.quizRepository.create(data);
  }

  async updateQuiz(id: string, data: UpdateQuizDto): Promise<Quiz> {
    // Normalize hints if provided
    if (data.hints) {
      data.hints = this.normalizeHints(data.hints);
    }
    
    return this.quizRepository.update(id, data);
  }
  
  // No batch operations needed - migration handled by separate script
}
```

### 3.3 GPT Integration - Unified Generation

#### Updated Prompt Builder for Integrated Hint Generation
```typescript
// In prompt-builder.ts
private getFillInBlankInstructions(): string {
  return `填空题格式说明：
- 使用至少4个下划线（____）表示空格
- 为每个空格提供一个简洁的提示词（2-4个字），描述答案的类型
- 提示词应该帮助学生理解需要填写什么类型的内容，但不能透露答案
- 如果答案从上下文很明显，可以不提供提示（使用null）
- 历史题目常用提示词：
  * 时间类：年份、朝代、世纪、时期、年代
  * 人物类：人名、皇帝、领袖、思想家、将领
  * 地理类：地名、国家、都城、地区、关隘
  * 事件类：战争、事件、条约、改革、起义
  * 文化类：著作、发明、制度、学派、文物
  * 其他类：数字、称号、民族、王朝、组织
- **答案格式**：
  * answer: "单个答案" 或 ["答案1", "答案2"] 
  * hints: ["提示1", "提示2"] 或 [null, "提示2"] (null表示不需要提示)`;
}

// Updated JSON Schema
getResponseSchema() {
  return {
    // ... existing schema
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { /* ... */ },
            question: { /* ... */ },
            options: { /* ... */ },
            answer: { /* ... */ },
            // NEW: Add hints field for fill-in-blank questions
            hints: {
              type: 'array',
              items: {
                anyOf: [
                  { type: 'string' },
                  { type: 'null' }
                ]
              },
              description: '填空题的提示词数组'
            }
          },
          required: ['type', 'question', 'options', 'answer'],
          // Make hints required only for fill-in-blank type
          allOf: [
            {
              if: { properties: { type: { const: 'fill-in-the-blank' } } },
              then: { required: ['hints'] }
            }
          ]
        }
      }
    }
  };
}
```

#### Example GPT Response with History-Focused Hints
```json
{
  "items": [
    {
      "type": "fill-in-the-blank",
      "question": "____年，____在____建立了中华人民共和国。",
      "options": [],
      "answer": ["1949", "毛泽东", "北京"],
      "hints": ["年份", "领袖", "都城"]
    },
    {
      "type": "fill-in-the-blank",
      "question": "____朝建立了科举制度，到____朝被废除。",
      "options": [],
      "answer": ["隋", "清"],
      "hints": ["朝代", "朝代"]
    },
    {
      "type": "fill-in-the-blank",
      "question": "____年爆发的____，标志着中国新民主主义革命的开始。",
      "options": [],
      "answer": ["1919", "五四运动"],
      "hints": ["年份", "事件"]
    },
    {
      "type": "fill-in-the-blank",
      "question": "____写的《____》是中国第一部纪传体通史。",
      "options": [],
      "answer": ["司马迁", "史记"],
      "hints": ["人名", "著作"]
    }
  ]
}
```

## 4. Frontend Implementation

### 4.1 Practice Page Enhancement

#### 4.1.1 Component Structure
```typescript
// QuizPractice.tsx enhancement
interface FillInBlankQuestionProps {
  question: string;
  hints?: string[];
  showHints: boolean;
  onToggleHints: () => void;
}

const FillInBlankQuestion: React.FC<FillInBlankQuestionProps> = ({
  question,
  hints = [],
  showHints,
  onToggleHints
}) => {
  const renderQuestionWithBlanks = () => {
    const parts = question.split(/_{2,}/g);
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="inline-flex items-center gap-1">
            <input 
              type="text" 
              className="border-b-2 border-gray-400 px-2"
              // ... existing input props
            />
            {showHints && hints?.[index] && hints[index].trim() !== '' && (
              <span className="text-sm text-gray-500">
                ({hints[index]})
              </span>
            )}
          </span>
        )}
      </React.Fragment>
    ));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onToggleHints}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showHints ? '隐藏提示' : '显示提示'}
        </button>
      </div>
      <div className="text-lg leading-relaxed">
        {renderQuestionWithBlanks()}
      </div>
    </div>
  );
};
```

#### 4.1.2 Practice Settings
```typescript
interface PracticeSettings {
  // ... existing settings
  showHints: boolean; // NEW: Toggle hint visibility
  hintDelay: number; // NEW: Show hints after N seconds (0 = immediate)
}

const defaultSettings: PracticeSettings = {
  // ... existing defaults
  showHints: true,
  hintDelay: 0
};
```

#### 4.1.3 User Preferences Storage
```typescript
// Store user hint preferences in localStorage
const HINT_PREFERENCES_KEY = 'quiz_hint_preferences';

interface HintPreferences {
  showByDefault: boolean;
  autoShowAfterAttempts: number;
  hintDelay: number;
}

const saveHintPreferences = (prefs: HintPreferences) => {
  localStorage.setItem(HINT_PREFERENCES_KEY, JSON.stringify(prefs));
};

const loadHintPreferences = (): HintPreferences => {
  const saved = localStorage.getItem(HINT_PREFERENCES_KEY);
  return saved ? JSON.parse(saved) : {
    showByDefault: true,
    autoShowAfterAttempts: 2,
    hintDelay: 0
  };
};
```

### 4.2 Quiz Parser Interface Enhancement

#### 4.2.1 Quiz Editor Component
```typescript
// QuizEditor.tsx
interface QuizEditorProps {
  quiz: QuizItem;
  onUpdate: (quiz: QuizItem) => void;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ quiz, onUpdate }) => {
  const [hints, setHints] = useState(quiz.hints || []);
  const [autoGenerating, setAutoGenerating] = useState(false);
  
  const handleAutoGenerateHints = async () => {
    setAutoGenerating(true);
    try {
      const response = await api.post('/quiz/generate-hints', {
        question: quiz.question,
        answer: quiz.answer
      });
      setHints(response.data.hints);
      onUpdate({ ...quiz, hints: response.data.hints, hintType: 'auto' });
    } finally {
      setAutoGenerating(false);
    }
  };
  
  const handleHintChange = (index: number, value: string) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
    onUpdate({ ...quiz, hints: newHints, hintType: 'manual' });
  };
  
  return (
    <div className="space-y-4">
      {/* Existing quiz editor fields */}
      
      {quiz.type === 'fill-in-the-blank' && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">填空提示</h4>
            <button
              onClick={handleAutoGenerateHints}
              disabled={autoGenerating}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
            >
              {autoGenerating ? '生成中...' : '自动生成提示'}
            </button>
          </div>
          
          {hints.map((hint, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <span>空格 {index + 1}:</span>
              <select
                value={hint}
                onChange={(e) => handleHintChange(index, e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="">无提示</option>
                <optgroup label="时间类">
                  <option value="年份">年份</option>
                  <option value="朝代">朝代</option>
                  <option value="世纪">世纪</option>
                  <option value="时期">时期</option>
                  <option value="年代">年代</option>
                </optgroup>
                <optgroup label="人物类">
                  <option value="人名">人名</option>
                  <option value="皇帝">皇帝</option>
                  <option value="领袖">领袖</option>
                  <option value="思想家">思想家</option>
                  <option value="将领">将领</option>
                </optgroup>
                <optgroup label="地理类">
                  <option value="地名">地名</option>
                  <option value="国家">国家</option>
                  <option value="都城">都城</option>
                  <option value="地区">地区</option>
                  <option value="关隘">关隘</option>
                </optgroup>
                <optgroup label="事件类">
                  <option value="战争">战争</option>
                  <option value="事件">事件</option>
                  <option value="条约">条约</option>
                  <option value="改革">改革</option>
                  <option value="起义">起义</option>
                </optgroup>
                <optgroup label="文化类">
                  <option value="著作">著作</option>
                  <option value="发明">发明</option>
                  <option value="制度">制度</option>
                  <option value="学派">学派</option>
                  <option value="文物">文物</option>
                </optgroup>
                <optgroup label="其他">
                  <option value="数字">数字</option>
                  <option value="称号">称号</option>
                  <option value="民族">民族</option>
                  <option value="王朝">王朝</option>
                  <option value="组织">组织</option>
                  <option value="custom">自定义...</option>
                </optgroup>
              </select>
              {hint === 'custom' && (
                <input
                  type="text"
                  placeholder="输入自定义提示"
                  className="border rounded px-2 py-1"
                  onChange={(e) => handleHintChange(index, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 4.3 Quiz Bank Management Interface

#### 4.3.1 Quiz List View
```typescript
// QuizBank.tsx enhancement
const QuizBank: React.FC = () => {
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);
  const [generatingHints, setGeneratingHints] = useState(false);
  
  const handleBatchGenerateHints = async () => {
    if (selectedQuizzes.length === 0) {
      alert('请先选择题目');
      return;
    }
    
    setGeneratingHints(true);
    try {
      const response = await api.post('/quiz/batch-generate-hints', {
        quizIds: selectedQuizzes
      });
      
      toast.success(`成功生成 ${response.data.success} 个题目的提示`);
      // Refresh quiz list
      fetchQuizzes();
    } catch (error) {
      toast.error('批量生成提示失败');
    } finally {
      setGeneratingHints(false);
      setSelectedQuizzes([]);
    }
  };
  
  return (
    <div>
      <div className="toolbar flex justify-between mb-4">
        <div>
          {/* Existing filters */}
        </div>
        <div className="actions">
          <button
            onClick={handleBatchGenerateHints}
            disabled={selectedQuizzes.length === 0 || generatingHints}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            {generatingHints ? '生成中...' : `批量生成提示 (${selectedQuizzes.length})`}
          </button>
        </div>
      </div>
      
      {/* Quiz list with hint indicators */}
      <table>
        <thead>
          <tr>
            <th>选择</th>
            <th>题目</th>
            <th>类型</th>
            <th>提示状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {quizzes.map(quiz => (
            <tr key={quiz.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedQuizzes.includes(quiz.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedQuizzes([...selectedQuizzes, quiz.id]);
                    } else {
                      setSelectedQuizzes(selectedQuizzes.filter(id => id !== quiz.id));
                    }
                  }}
                />
              </td>
              <td>{quiz.question}</td>
              <td>{quiz.type}</td>
              <td>
                {quiz.type === 'fill-in-the-blank' && (
                  <span className={`badge ${quiz.hints ? 'badge-success' : 'badge-warning'}`}>
                    {quiz.hints ? `${quiz.hintType === 'auto' ? '自动' : '手动'}提示` : '无提示'}
                  </span>
                )}
              </td>
              <td>
                <button onClick={() => editQuiz(quiz)}>编辑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## 5. Implementation Phases (Simplified)

### Phase 1: Backend Core (Week 1)
- [ ] Add `hints` field to quiz schema
- [ ] Database migration to add hints column
- [ ] Update quiz DTOs to include hints field
- [ ] Normalize hints in service layer (empty string → null)

### Phase 2: GPT Integration (Week 1-2)
- [ ] Update prompt-builder.ts with hint instructions
- [ ] Modify JSON schema to include hints field
- [ ] Test GPT responses with hint generation
- [ ] Handle hints in quiz post-processing

### Phase 3: API Updates (Week 2)
- [ ] Update existing quiz endpoints to accept/return hints
- [ ] Update Swagger documentation  
- [ ] API testing with hints
- [ ] Create migration script for existing quizzes (separate task)

### Phase 4: Frontend - Quiz Parser (Week 2-3)
- [ ] Display generated hints in quiz preview
- [ ] Add hint editing UI in quiz editor
- [ ] Support manual hint addition/modification
- [ ] Show hints in export data

### Phase 5: Frontend - Practice Page (Week 3-4)
- [ ] Render hints inline with blanks
- [ ] Add toggle button for hint visibility
- [ ] Store hint preferences in localStorage
- [ ] Style hints appropriately

### Phase 6: Frontend - Quiz Bank (Week 4)
- [ ] Show hint indicators in quiz list
- [ ] Add hint editing in quiz detail view
- [ ] Batch hint generation for existing quizzes
- [ ] Filter quizzes by hint availability

### Phase 7: Migration & Testing (Week 5)
- [ ] Migrate existing fill-in-blank quizzes
- [ ] End-to-end testing
- [ ] Performance verification
- [ ] Documentation updates

## 6. Testing Strategy

### 6.1 Unit Tests
```typescript
describe('HintService', () => {
  it('should generate appropriate hint for person name', async () => {
    const hint = await hintService.generateHint('____统一了六国', '秦始皇');
    expect(hint).toEqual(['人名']);
  });
  
  it('should generate multiple hints for multiple blanks', async () => {
    const hints = await hintService.generateHint(
      '____年，____建立了____朝',
      ['1368', '朱元璋', '明']
    );
    expect(hints).toEqual(['年份', '人名', '朝代']);
  });
  
  it('should handle sparse hints with null values', async () => {
    const hints = await hintService.generateHint(
      '在____年的春天，花儿都开了',
      '2024'
    );
    expect(hints).toEqual([null]); // Year is obvious from context
  });
  
  it('should normalize empty strings to null', async () => {
    const result = await hintService.updateHints('quiz-1', ['', '人名', ' '], 'manual');
    expect(result.hints).toEqual([null, '人名', null]);
  });
  
  it('should handle custom hints', async () => {
    await hintService.updateHints('quiz-1', ['自定义提示'], 'user-123');
    const quiz = await quizRepository.findById('quiz-1');
    expect(quiz.hints).toEqual(['自定义提示']);
  });
});
```

### 6.2 Integration Tests
- API endpoint testing with various quiz types
- GPT integration with mock responses
- Database transaction testing
- Batch processing performance

### 6.3 E2E Tests
- Complete flow from quiz creation to practice
- Hint generation and editing workflow
- User preference persistence
- Multi-user concurrent access

## 7. Performance Considerations

### 7.1 Caching Strategy
- Cache generated hints for 24 hours
- Invalidate on manual updates
- Batch API calls for efficiency

### 7.2 Database Optimization
- Index on hint_type for filtering
- JSONB indexing for hint content search
- Batch update operations

### 7.3 Frontend Optimization
- Lazy load hints only when needed
- Debounce hint generation requests
- Local storage for user preferences

## 8. Security & Privacy

### 8.1 Access Control
- Teachers can edit any hint
- Students can only toggle visibility
- Admin can batch generate/update

### 8.2 Data Validation
- Sanitize hint content
- Validate against XSS attacks
- Length limitations (max 20 characters)

## 9. Monitoring & Analytics

### 9.1 Metrics to Track
- Hint usage rate by students
- Hint effectiveness (accuracy improvement)
- Auto-generation success rate
- Manual override frequency

### 9.2 Logging
```typescript
logger.info('Hint generated', {
  quizId,
  hintType: 'auto',
  hints,
  generationTime: Date.now() - startTime
});
```

## 10. Migration Plan

### 10.1 Existing Data
1. Identify all fill-in-the-blank questions
2. Batch generate hints for existing questions
3. Allow manual review and adjustment
4. Deploy with feature flag

### 10.2 Rollback Strategy
- Feature flag to disable hints
- Keep original schema intact
- Gradual rollout by user group

## 11. Documentation Updates

### 11.1 API Documentation
- Update Swagger schemas
- Add hint-related endpoints
- Provide example requests/responses

### 11.2 User Guide
- Teacher guide for hint management
- Student guide for using hints
- Best practices for hint creation

## 12. Future Enhancements

### 12.1 Advanced Features
- Multi-language hint support
- Context-aware hint generation
- Difficulty-based hint granularity
- Audio hints for accessibility

### 12.2 Machine Learning
- Learn from user interactions
- Predict optimal hint types
- Personalized hint preferences
- A/B testing framework

## 13. Success Criteria

### 13.1 Technical Metrics
- 95% hint generation success rate
- <200ms hint display latency
- Zero data loss during migration

### 13.2 User Metrics
- 80% student hint usage rate
- 25% improvement in answer accuracy
- 90% teacher satisfaction score

## 14. Risk Assessment

### 14.1 Technical Risks
- **Risk**: GPT API failures
  - **Mitigation**: Fallback to pattern-based hints
  
- **Risk**: Performance degradation
  - **Mitigation**: Implement caching and batch processing

### 14.2 User Experience Risks
- **Risk**: Hints too revealing
  - **Mitigation**: Teacher review and adjustment capability
  
- **Risk**: Student over-reliance
  - **Mitigation**: Progressive hint reveal option

## 15. Appendix

### 15.1 Sample Hint Mappings
```javascript
const HINT_PATTERNS = {
  '人名': /人|者|帝|王|将|相|家$/,
  '地名': /国|省|市|县|山|河|海|洋$/,
  '年份': /\d{3,4}年/,
  '朝代': /朝|代|朝代$/,
  '数字': /^\d+$/,
  '概念': /主义|理论|学说|定律/
};
```

### 15.2 Clean Architecture Benefits
This design separates concerns properly:

1. **Core Data Model** (`quizzes` table):
   - Contains only educational content
   - Simple `hints` JSONB field
   - No metadata pollution

2. **Audit/Metadata** (optional `quiz_hint_audit` table):
   - Tracks how hints were generated
   - Records who modified hints
   - Stores LLM model information
   - Can be queried for analytics but doesn't affect core functionality

3. **API Simplicity**:
   - Clients only receive/send hints array
   - No need to understand internal metadata
   - Cleaner request/response payloads

4. **Future Flexibility**:
   - Can change tracking mechanism without affecting API
   - Can add more metadata fields without schema migration
   - Can disable auditing entirely if not needed

### 15.3 API Response Examples
```json
// Successful hint generation
{
  "success": true,
  "data": {
    "quizId": "uuid-here",
    "hints": ["人名", "朝代"],
    "hintType": "auto",
    "confidence": 0.95
  }
}

// Batch generation result
{
  "processed": 10,
  "success": 8,
  "failed": 2,
  "results": [
    {
      "quizId": "uuid-1",
      "status": "success",
      "hints": ["年份"]
    },
    {
      "quizId": "uuid-2", 
      "status": "failed",
      "error": "Unable to determine hint type"
    }
  ]
}
```

## Conclusion

The fill-in-the-blank hint system is designed as a natural extension of the existing quiz system, not a separate feature. By integrating hint generation directly into the GPT quiz creation process and treating hints as just another field in the quiz data model, we achieve:

1. **Minimal Code Changes**: Only add a field to the schema and update prompts
2. **No New APIs**: Existing endpoints handle hints automatically
3. **Zero Infrastructure Overhead**: No new services, tables, or tracking systems
4. **Seamless Integration**: Hints flow through the system like any other quiz data
5. **Simple Migration**: Existing quizzes handled via separate script, not API complexity

This approach exemplifies good software design - achieving powerful functionality through simplicity rather than complexity. The hint system enhances the learning experience while maintaining the codebase's clarity and maintainability.