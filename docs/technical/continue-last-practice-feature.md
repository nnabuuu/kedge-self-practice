# Continue Last Practice Feature - Design Document

## Overview
Allow students to resume incomplete practice sessions instead of losing their progress. When a student returns to the practice page, they will be prompted to either continue their last unfinished session or start a new one.

## User Experience Flow

### Scenario 1: User Has Incomplete Session
1. Student navigates to practice page
2. System detects incomplete session from last visit
3. Modal/Banner appears with options:
   - **"继续上次练习"** - Resume from where they left off
   - **"开始新练习"** - Abandon old session and configure new practice
4. If user chooses to continue:
   - Load previous session with all answers preserved
   - Navigate to the first unanswered question
   - Display progress indicator showing completed vs remaining questions

### Scenario 2: User Has No Incomplete Session
1. Student navigates to practice page
2. Show normal practice configuration UI
3. Start fresh practice session

### Scenario 3: Session Expired
1. Incomplete sessions older than 7 days are automatically marked as abandoned
2. User sees normal configuration UI (no resume prompt)

## Technical Implementation

### Database Schema
Current `practice_sessions` table already supports this with:
```sql
- id (UUID)
- user_id (UUID)
- status ('pending' | 'in_progress' | 'completed' | 'abandoned')
- answered_questions (INTEGER)
- total_questions (INTEGER)
- knowledge_point_ids (TEXT[])
- quiz_ids (UUID[])
- created_at, started_at, completed_at
```

**New additions needed:**
- `last_question_index` (INTEGER) - Track which question user was on
- `session_state` (JSONB) - Store UI state like shuffle seed, timer state

### Question Restoration Strategy

**IMPORTANT: We restore the exact same questions, not generate new ones.**

#### Why Restore Exact Questions?

1. **Answer Integrity**: The `practice_answers` table stores answers linked to specific `quiz_id` values. If we regenerated questions, the stored answers would reference non-existent questions.

2. **User Expectation**: Students expect to see the same questions they started with, especially if they partially answered a fill-in-blank question or were reviewing a specific question.

3. **Progress Consistency**: Showing "You answered Question 3 correctly" only makes sense if it's the same Question 3 the user originally saw.

4. **Database Design**: The `quiz_ids UUID[]` field in `practice_sessions` was designed to snapshot the exact question set at session creation time.

#### Resume Flow Logic

```typescript
// Backend: Resume session implementation
async resumeSession(sessionId: string, userId: string) {
  // 1. Fetch the session record
  const session = await practiceRepository.getSessionById(sessionId);

  // Validate ownership
  if (session.user_id !== userId) {
    throw new UnauthorizedException();
  }

  // 2. Load the EXACT SAME questions using stored quiz_ids
  // This is critical - we use the IDs stored at session creation
  const questions = await quizRepository.getQuizzesByIds(session.quiz_ids);

  // 3. Load all previous answers for this session
  const answers = await practiceRepository.getAnswersBySessionId(sessionId);

  // 4. Determine current position
  const currentIndex = session.last_question_index || answers.length;

  // 5. Return everything needed to restore the UI state
  return {
    session,
    questions,      // Same questions, in same order
    answers,        // Answers that match these question IDs
    currentIndex    // Where to resume from
  };
}
```

#### Question Content Changes

**Edge Case**: What if a teacher edited a question after the session started?

**Solution**: We still load the question by ID (getting latest content). This is acceptable because:
- The question ID remains the same (referential integrity maintained)
- Content updates are usually minor (typo fixes, clarifications)
- Alternative of storing full question snapshots adds significant complexity

If full question immutability is required later, we can:
1. Store question snapshots in `session_state` JSONB field
2. Add a `quiz_snapshots` table for version history
3. Implement a warning when resuming if questions were modified

**For MVP: Load questions by ID, accept that content may have changed slightly.**

### Backend API Endpoints

#### 1. Get Incomplete Session
```typescript
GET /v1/practice/incomplete-session

Response:
{
  success: true,
  data: {
    sessionId: string,
    progress: {
      current: number,
      total: number,
      answered: number
    },
    configuration: {
      knowledgePointIds: string[],
      questionTypes: string[],
      timeLimit: number
    },
    lastActivityAt: string,
    answers: Array<{
      quizId: string,
      userAnswer: any,
      isCorrect: boolean
    }>
  }
}
```

#### 2. Resume Session
```typescript
POST /v1/practice/resume/:sessionId

Response:
{
  success: true,
  data: {
    session: PracticeSession,
    questions: QuizQuestion[],
    previousAnswers: Answer[],
    currentQuestionIndex: number
  }
}
```

#### 3. Abandon Session
```typescript
POST /v1/practice/abandon/:sessionId

Response:
{
  success: true,
  message: "Session marked as abandoned"
}
```

### Frontend Components

#### 1. `ContinuePracticeModal.tsx`
Modal that appears when incomplete session is detected:
```tsx
interface ContinuePracticeModalProps {
  session: IncompleteSession;
  onContinue: () => void;
  onStartNew: () => void;
  onClose: () => void;
}
```

Features:
- Show progress statistics (e.g., "您已完成 5/20 题")
- Show knowledge points being practiced
- Show time elapsed/remaining
- Prominent "继续练习" button
- Secondary "开始新练习" button with confirmation

#### 2. `PracticeMenu.tsx` Updates
- Check for incomplete session on mount
- Show modal if session exists
- Add badge indicator showing incomplete session count

#### 3. Session State Management
Store in component state:
```typescript
interface SessionState {
  sessionId: string;
  isResuming: boolean;
  currentQuestionIndex: number;
  previousAnswers: Map<string, any>;
  configuration: PracticeConfig;
}
```

### API Service Updates

```typescript
// In api.ts or practiceService.ts
export const practiceApi = {
  // Check for incomplete sessions
  getIncompleteSession: async (): Promise<ApiResponse<IncompleteSession | null>>,

  // Resume a session
  resumeSession: async (sessionId: string): Promise<ApiResponse<SessionData>>,

  // Abandon a session
  abandonSession: async (sessionId: string): Promise<ApiResponse<void>>,
}
```

## Implementation Steps

### Phase 1: Database Migration (Backend)
1. Create migration to add `last_question_index` and `session_state` columns
2. Add index on `user_id` + `status` for fast incomplete session queries

### Phase 2: Backend API (Backend)
1. Implement repository methods in `practice.repository.ts`:
   - `findIncompleteSessionByUserId(userId: string)`
   - `updateSessionProgress(sessionId, questionIndex, state)`
   - `abandonSession(sessionId)`
2. Create controller endpoints in `practice.controller.ts`
3. Add proper error handling and validation

### Phase 3: Frontend Service (Frontend)
1. Create `continueSessionService.ts`
2. Add API methods to `api.ts`
3. Update practice session creation to track progress

### Phase 4: Frontend UI (Frontend)
1. Create `ContinuePracticeModal` component
2. Update `PracticeMenu` to check for incomplete sessions
3. Update `QuizPracticeMain` to handle resumed sessions
4. Add progress tracking during practice

### Phase 5: Testing & Polish
1. Test resume flow with various question types
2. Test session expiration
3. Test concurrent session handling
4. Add loading states and error handling
5. Test with mock data and real backend

## Edge Cases & Considerations

### 1. Multiple Incomplete Sessions
**Solution**: Only show the most recent incomplete session (by `started_at` DESC)

### 2. Session Expired While User Away
**Solution**: Check session validity on resume. If >7 days old, auto-abandon and show config UI

### 3. Questions Modified After Session Started
**Solution**: Session stores quiz_ids at creation. We load questions by these IDs (getting latest content). See "Question Content Changes" section above for detailed explanation. For MVP, we accept minor content changes; full immutability can be added later if needed.

### 4. Network Failure During Resume
**Solution**:
- Show retry button
- Fallback to local storage if backend unavailable
- Graceful degradation

### 5. User Closes Tab Mid-Practice
**Solution**: Auto-save progress on:
- Answer submission
- Question navigation
- Window beforeunload event (with debounce)

### 6. Session State Sync
**Solution**:
- Backend is source of truth
- Update backend on each answer submission
- Don't rely on localStorage for persistence

## UI/UX Mockup

### Continue Practice Modal
```
╔═══════════════════════════════════════════════╗
║  🎯 发现未完成的练习                            ║
║                                               ║
║  练习内容：                                     ║
║  • 中外历史纲要上 - 第一单元                     ║
║  • 题目类型：单选题、填空题                      ║
║                                               ║
║  进度：5 / 20 题 (25%)                         ║
║  用时：8 分钟                                   ║
║  上次练习：2 分钟前                             ║
║                                               ║
║  ┌─────────────────────────────────────────┐  ║
║  │  [📝 继续练习]  大按钮，蓝色，主要操作     │  ║
║  └─────────────────────────────────────────┘  ║
║                                               ║
║  [ 开始新练习 ]  小按钮，灰色，次要操作         ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

### Progress Indicator During Practice
```
顶部进度条：
┌─────────────────────────────────────────────┐
│ █████████████░░░░░░░░░░░░░░░░░░░ 5/20 题     │
│ ⏱️ 已用时：8:23                              │
└─────────────────────────────────────────────┘
```

## Analytics & Metrics

Track the following metrics:
1. **Resume Rate**: % of incomplete sessions that get resumed
2. **Completion Rate**: % of resumed sessions that get completed
3. **Abandonment Reasons**: Track if user chose "start new" vs auto-expire
4. **Average Time Between Pause & Resume**

## Success Criteria

✅ User can resume practice session after browser close/refresh
✅ All answered questions are preserved with correct/incorrect status
✅ User lands on first unanswered question
✅ Session expires after 7 days
✅ Multiple devices handled correctly (most recent session)
✅ Modal dismissed preference stored (optional enhancement)
✅ No data loss during resume flow

## Future Enhancements

1. **Multiple Session Management**: Allow users to have multiple incomplete sessions and choose which to resume
2. **Session History**: Show list of all incomplete sessions with metadata
3. **Smart Expiration**: Adjust expiration time based on session progress (e.g., 90% complete sessions last longer)
4. **Offline Mode**: Store session in IndexedDB for offline resume capability
5. **Cross-Device Sync**: Real-time sync of session state across devices
6. **Session Bookmarking**: Allow user to manually "save for later" with a note

## Timeline Estimate

- **Phase 1** (Backend Migration): 0.5 day
- **Phase 2** (Backend API): 1 day
- **Phase 3** (Frontend Service): 0.5 day
- **Phase 4** (Frontend UI): 1.5 days
- **Phase 5** (Testing & Polish): 1 day

**Total: ~4.5 days**

## Dependencies

- Existing practice session backend implementation
- User authentication system
- Practice session creation flow
- Question loading and display system

## Security Considerations

1. **Authorization**: Verify user owns the session before allowing resume
2. **Session Hijacking**: Use JWT tokens with session_id claim
3. **Data Tampering**: Validate session state integrity on resume
4. **Rate Limiting**: Prevent abuse of session creation/abandonment

## Rollout Plan

1. **Internal Testing** (Week 1): Test with development team
2. **Beta Testing** (Week 2): Release to 10% of users with feature flag
3. **Staged Rollout** (Week 3): 25% → 50% → 100% with monitoring
4. **Feedback Collection**: Gather user feedback via in-app survey
