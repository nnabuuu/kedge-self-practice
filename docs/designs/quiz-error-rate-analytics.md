# Quiz Error Rate Analytics - UX Design

## Overview
A teacher analytics feature to identify problematic quiz questions by viewing error rates across different time periods and knowledge points. This helps teachers understand which questions students struggle with most and where curriculum adjustments may be needed.

## Business Value
- **Identify weak questions**: Find questions that need revision or better explanation
- **Curriculum insights**: Understand which knowledge points need more teaching attention
- **Data-driven decisions**: Make informed choices about which topics to reinforce
- **Quality improvement**: Continuously improve quiz quality based on student performance

## Feature Location
**Path**: Teacher Dashboard → Quiz Analytics → Error Rate Analysis

## User Interface Design

### Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Quiz Error Rate Analysis                                [Help] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 Filters                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Subject: [History ▼]     Knowledge Point: [All ▼]       │   │
│  │                                                           │   │
│  │ Time Frame:                                              │   │
│  │  ⚪ 7 days  ⚪ 30 days  🔵 3 months  ⚪ 6 months  ⚪ All  │   │
│  │                                                           │   │
│  │ Min Attempts: [5 ▼]  (Only show questions with ≥5 tries)│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  📈 Summary Stats                                               │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐    │
│  │ Total Qs    │ Avg Error   │ High Error  │ Total       │    │
│  │ Analyzed    │ Rate        │ Questions   │ Attempts    │    │
│  ├─────────────┼─────────────┼─────────────┼─────────────┤    │
│  │    156      │   32.5%     │   23 (>50%) │   4,523     │    │
│  └─────────────┴─────────────┴─────────────┴─────────────┘    │
│                                                                  │
│  📋 Questions by Error Rate                    [Export CSV]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ #  │ Question Preview          │ Error │ Attempts │ KP  │   │
│  ├────┼──────────────────────────┼───────┼──────────┼─────┤   │
│  │ 1  │ 🔴 战国七雄中最强大的国家是？│ 87.3% │   126    │ 2.1 │   │
│  │    │ [单选] A.齐 B.楚 C.燕 D.秦 │       │          │     │   │
│  │    │ Common Wrong: B (65%)      │       │          │     │   │
│  │    │ [View Details] [Edit Quiz] │       │          │     │   │
│  ├────┼──────────────────────────┼───────┼──────────┼─────┤   │
│  │ 2  │ 🟠 春秋五霸中最早称霸的是？│ 72.1% │    89    │ 2.1 │   │
│  │    │ [单选] A.齐桓公 B.晋文公    │       │          │     │   │
│  │    │ Common Wrong: B (58%)      │       │          │     │   │
│  │    │ [View Details] [Edit Quiz] │       │          │     │   │
│  ├────┼──────────────────────────┼───────┼──────────┼─────┤   │
│  │ 3  │ 🟡 填空：____发明了造纸术  │ 68.5% │    73    │ 2.3 │   │
│  │    │ [填空] 正确答案：蔡伦      │       │          │     │   │
│  │    │ Common Wrong: 蔡伦 (35%)   │       │          │     │   │
│  │    │ [View Details] [Edit Quiz] │       │          │     │   │
│  └────┴──────────────────────────┴───────┴──────────┴─────┘   │
│                                                                  │
│  [Load More] Showing 20 of 156 questions                        │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Design Elements

#### Error Rate Indicators
- 🔴 **High Error (>60%)**: Red indicator, requires immediate attention
- 🟠 **Medium-High Error (40-60%)**: Orange indicator, needs review
- 🟡 **Medium Error (20-40%)**: Yellow indicator, monitor
- 🟢 **Low Error (<20%)**: Green indicator, performing well

#### Color Coding
```
┌──────────────────────────────────┐
│ Error Rate Bar Chart             │
├──────────────────────────────────┤
│ ████████████████████ 87.3%  🔴  │
│ ██████████████ 72.1%       🟠  │
│ ████████████ 68.5%         🟡  │
│ ███ 15.2%                  🟢  │
└──────────────────────────────────┘
```

### Time Frame Options

| Option | Description | SQL Window |
|--------|-------------|------------|
| **7 days** | Last week | `WHERE created_at >= NOW() - INTERVAL '7 days'` |
| **30 days** | Last month | `WHERE created_at >= NOW() - INTERVAL '30 days'` |
| **3 months** | Last quarter | `WHERE created_at >= NOW() - INTERVAL '3 months'` |
| **6 months** | Last semester | `WHERE created_at >= NOW() - INTERVAL '6 months'` |
| **All time** | Lifetime | No filter |

### Minimum Attempts Filter
Purpose: Exclude questions with too few attempts for statistical significance

Options:
- **5 attempts** (default)
- 10 attempts
- 20 attempts
- 50 attempts
- No minimum

Rationale: A question with 2 attempts and 1 wrong (50% error) is not as significant as a question with 100 attempts and 50 wrong (50% error).

## Data Model

### Required Data Points
```typescript
interface QuizErrorRate {
  quiz_id: string;
  quiz_text: string;
  quiz_type: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective';
  correct_answer: string | string[];
  knowledge_point_id: string;
  knowledge_point_name: string;

  // Statistics
  total_attempts: number;        // Total times attempted
  incorrect_attempts: number;    // Times answered incorrectly
  error_rate: number;            // incorrect / total (percentage)

  // Common wrong answers
  wrong_answer_distribution: {
    answer: string;
    count: number;
    percentage: number;
  }[];

  // Time-based
  time_frame_start?: Date;
  time_frame_end?: Date;
}
```

### SQL Query Structure
```sql
WITH quiz_stats AS (
  SELECT
    q.id AS quiz_id,
    q.question AS quiz_text,
    q.type AS quiz_type,
    q.answer AS correct_answer,
    kp.id AS knowledge_point_id,
    kp.name AS knowledge_point_name,
    COUNT(pa.id) AS total_attempts,
    SUM(CASE WHEN pa.is_correct = false THEN 1 ELSE 0 END) AS incorrect_attempts,
    ROUND(
      100.0 * SUM(CASE WHEN pa.is_correct = false THEN 1 ELSE 0 END) /
      NULLIF(COUNT(pa.id), 0),
      2
    ) AS error_rate
  FROM quizzes q
  LEFT JOIN knowledge_points kp ON q.knowledge_point_id = kp.id
  LEFT JOIN practice_answers pa ON pa.quiz_id = q.id
  WHERE
    pa.created_at >= :time_frame_start
    AND pa.created_at <= :time_frame_end
    AND (:knowledge_point_id IS NULL OR kp.id = :knowledge_point_id)
  GROUP BY q.id, q.question, q.type, q.answer, kp.id, kp.name
  HAVING COUNT(pa.id) >= :min_attempts
)
SELECT *
FROM quiz_stats
ORDER BY error_rate DESC
LIMIT :limit OFFSET :offset;
```

## User Workflows

### Primary Flow: Identify High-Error Questions
1. Teacher navigates to **Quiz Analytics → Error Rate Analysis**
2. Select subject (e.g., "History")
3. Select time frame (default: 3 months)
4. Select knowledge point filter (optional, default: "All")
5. View list sorted by error rate (highest first)
6. Click **[View Details]** on high-error question
7. See detailed breakdown:
   - All wrong answers and their frequency
   - Time trend (is it getting better/worse?)
   - Which students got it wrong
   - Question text and correct answer
8. Click **[Edit Quiz]** to improve the question
9. Save changes and monitor improvement over time

### Secondary Flow: Export for Offline Analysis
1. Apply filters (time frame, knowledge point)
2. Click **[Export CSV]**
3. Download file: `quiz-error-rates-2025-01-15.csv`
4. Analyze in Excel/Google Sheets
5. Share with other teachers for discussion

### Tertiary Flow: Compare Time Periods
1. Select "30 days" time frame
2. Note average error rate (e.g., 35.2%)
3. Change to "7 days" time frame
4. Compare average error rate (e.g., 28.9%)
5. Conclusion: Recent improvements working! 📈

## Detailed View Modal

When clicking **[View Details]** on a question:

```
┌─────────────────────────────────────────────────────────────┐
│  Question Details - Error Analysis                    [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Question ID: Q12345                                         │
│  Type: 单选题 (Single Choice)                                │
│  Knowledge Point: 2.1 战国七雄                               │
│                                                              │
│  ❓ Question:                                                │
│  战国七雄中最强大的国家是？                                  │
│                                                              │
│  ✅ Correct Answer: D. 秦                                   │
│                                                              │
│  📊 Performance Statistics (Last 3 months)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Total Attempts:     126                              │  │
│  │ Correct:           16 (12.7%)   🔴                   │  │
│  │ Incorrect:         110 (87.3%)                       │  │
│  │                                                       │  │
│  │ Error Rate Trend:                                    │  │
│  │ Week 1: 85%  Week 2: 88%  Week 3: 89%  Week 4: 86%  │  │
│  │ ⚠️  Error rate is INCREASING over time               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  🎯 Wrong Answer Distribution                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ B. 楚    │ ████████████████ 82 (65.1%)              │  │
│  │ A. 齐    │ ████ 20 (15.9%)                          │  │
│  │ C. 燕    │ ██ 8 (6.3%)                              │  │
│  │ (blank)  │ ▌ 0                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  💡 Insights & Recommendations                               │
│  • 65% of students choose "楚" - possible misconception     │
│  • Consider adding explanation about Qin's reforms          │
│  • May need clearer question wording                        │
│  • Add hint: "Think about who unified China"               │
│                                                              │
│  👥 Students Who Got It Wrong (Recent 10)                    │
│  • 张三 (2025-01-14) - Chose B                              │
│  • 李四 (2025-01-14) - Chose B                              │
│  • 王五 (2025-01-13) - Chose A                              │
│  • ... [View All 110 Students]                              │
│                                                              │
│  [Edit Question] [Add Explanation] [Archive] [Close]        │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### 1. Get Quiz Error Rates (Paginated)
```typescript
GET /v1/teacher/analytics/quiz-error-rates

Query Parameters:
- subject_id: string (required)
- knowledge_point_id?: string (optional, filter by specific KP)
- time_frame: '7d' | '30d' | '3m' | '6m' | 'all' (default: '3m')
- min_attempts: number (default: 5)
- page: number (default: 1)
- page_size: number (default: 20)
- sort: 'error_rate_desc' | 'error_rate_asc' | 'attempts_desc' (default: 'error_rate_desc')

Response:
{
  success: true,
  data: {
    summary: {
      total_questions: 156,
      avg_error_rate: 32.5,
      high_error_count: 23,  // >60% error
      total_attempts: 4523
    },
    questions: [
      {
        quiz_id: "uuid",
        quiz_text: "战国七雄中最强大的国家是？",
        quiz_type: "single-choice",
        correct_answer: "D",
        options: {A: "齐", B: "楚", C: "燕", D: "秦"},
        knowledge_point: {id: "kp-123", name: "战国七雄"},
        total_attempts: 126,
        incorrect_attempts: 110,
        error_rate: 87.3,
        wrong_answers: [
          {answer: "B", count: 82, percentage: 65.1},
          {answer: "A", count: 20, percentage: 15.9},
        ]
      },
      // ... more questions
    ],
    pagination: {
      current_page: 1,
      page_size: 20,
      total_pages: 8,
      total_count: 156
    }
  }
}
```

### 2. Get Detailed Quiz Error Analysis
```typescript
GET /v1/teacher/analytics/quiz/:quizId/error-details

Query Parameters:
- time_frame: '7d' | '30d' | '3m' | '6m' | 'all' (default: '3m')

Response:
{
  success: true,
  data: {
    quiz_id: "uuid",
    question: "战国七雄中最强大的国家是？",
    type: "single-choice",
    correct_answer: "D",
    options: {...},
    knowledge_point: {...},
    statistics: {
      total_attempts: 126,
      correct_count: 16,
      incorrect_count: 110,
      error_rate: 87.3,
      error_trend: [
        {week: 1, error_rate: 85},
        {week: 2, error_rate: 88},
        {week: 3, error_rate: 89},
        {week: 4, error_rate: 86}
      ]
    },
    wrong_answer_distribution: [...],
    recent_wrong_students: [
      {
        student_id: "uuid",
        student_name: "张三",
        attempted_at: "2025-01-14T10:30:00Z",
        selected_answer: "B"
      },
      // ... up to 10 recent
    ]
  }
}
```

### 3. Export CSV
```typescript
GET /v1/teacher/analytics/quiz-error-rates/export

Query Parameters: (same as #1)

Response:
Content-Type: text/csv
Content-Disposition: attachment; filename="quiz-error-rates-2025-01-15.csv"

Rank,Quiz ID,Question,Type,Knowledge Point,Error Rate,Total Attempts,Incorrect,Correct
1,q-123,"战国七雄中最强大的国家是？",单选,战国七雄,87.3%,126,110,16
2,q-456,"春秋五霸中最早称霸的是？",单选,春秋五霸,72.1%,89,64,25
...
```

## Backend Implementation

### Database Schema Changes (if needed)
Existing tables should already support this feature:
- `quizzes` - quiz questions
- `practice_answers` - student answers with is_correct flag
- `knowledge_points` - knowledge point metadata

No new tables needed, but consider adding indexes:
```sql
CREATE INDEX idx_practice_answers_quiz_created
  ON practice_answers(quiz_id, created_at);

CREATE INDEX idx_practice_answers_correct
  ON practice_answers(quiz_id, is_correct, created_at);
```

### Controller: `analytics.controller.ts`
```typescript
@Controller('teacher/analytics')
@UseGuards(JwtAuthGuard, TeacherGuard)
export class AnalyticsController {
  @Get('quiz-error-rates')
  async getQuizErrorRates(@Request() req, @Query() query) {
    // Implementation
  }

  @Get('quiz/:quizId/error-details')
  async getQuizErrorDetails(@Param('quizId') quizId, @Query() query) {
    // Implementation
  }

  @Get('quiz-error-rates/export')
  async exportQuizErrorRates(@Request() req, @Query() query, @Res() res) {
    // Generate CSV and stream
  }
}
```

## Frontend Implementation

### New Component: `QuizErrorRateAnalytics.tsx`
Location: `frontend-practice/src/pages/teacher/QuizErrorRateAnalytics.tsx`

Key features:
- Filter bar (subject, KP, time frame, min attempts)
- Summary stats cards
- Paginated table with error rate sorting
- Detail modal
- Export button
- Loading states
- Error handling

### Integration with Teacher Dashboard
Add new navigation item:
```tsx
<nav>
  <NavItem icon={BookOpen} to="/teacher/quiz-bank">Quiz Bank</NavItem>
  <NavItem icon={Users} to="/teacher/students">Students</NavItem>
  <NavItem icon={BarChart} to="/teacher/analytics">Analytics</NavItem>
  <NavItem icon={TrendingDown} to="/teacher/error-rates">Error Analysis</NavItem>
</nav>
```

## Success Metrics
- **Adoption**: % of teachers using error rate analytics monthly
- **Action Rate**: % of high-error questions edited after viewing
- **Improvement**: Average error rate reduction after teacher intervention
- **Engagement**: Average time spent on analytics page
- **Export Usage**: Number of CSV exports per month

## Future Enhancements
1. **AI Recommendations**: Suggest improvements to high-error questions
2. **Comparison Mode**: Compare error rates between different classes
3. **Alerts**: Email notifications for questions with >80% error rate
4. **Historical Tracking**: Show improvement over multiple time periods
5. **Student-Level Drill-Down**: See which students struggle with specific KPs
6. **Question Difficulty Scoring**: Automatic difficulty classification
7. **A/B Testing**: Test different question wordings and compare error rates
