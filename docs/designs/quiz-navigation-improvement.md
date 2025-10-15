# Quiz Navigation Improvement - UX Design

## Overview
Improve quiz navigation to allow users to freely navigate between questions at any time, with clear visual indicators of question status and current position.

## Current Issues
1. Navigation buttons only appear after answering the current question
2. Users cannot review previous answers without first answering current question
3. Navigation controls are "hidden" until user provides an answer
4. Users feel "stuck" on unanswered questions

## Proposed Solution: Always-Visible Navigation

### Core Features

#### 1. Always-Visible Navigation Controls
- **Previous Button** (◀): Navigate to previous question
  - Disabled only when on first question (Q1)
  - Always visible otherwise

- **Home Button** (🏠): Jump back to current working question
  - Shows when viewing a different question than the working question
  - Displays tooltip: "返回当前题 (第X题)"
  - Disabled when already on the working question

- **Next Button** (▶): Navigate to next question
  - Disabled only when on last question
  - Always visible otherwise

#### 2. Visual Indicators

**Question Number Display:**
```
题目 5/20 ✓
```
- Show checkmark (✓) if question is answered
- Highlight in **orange** if viewing a different question than working question
- Regular color when viewing the working question

**Navigation Button Group:**
```
[◀] [🏠] [▶]  |  题目 5/20 ✓
```

#### 3. Auto-Save Behavior
When navigating away from a question with partial input:
- **Single Choice**: Save selected option immediately on click
- **Multiple Choice**: Save currently selected options
- **Fill-in-blank**: Save all filled blanks (even if incomplete)
- **Essay**: Save current text content

**State Management:**
- Use `answers` array to store partial/complete answers
- Track completion status separately (whether user "submitted" the answer)
- Distinguish between "answered" (has data) vs "completed" (submitted for grading)

#### 4. Question State Tracking

```typescript
// Existing: answers array
const [answers, setAnswers] = useState<any[]>(Array(questions.length).fill(null));

// New: completion status array
const [completionStatus, setCompletionStatus] = useState<boolean[]>(Array(questions.length).fill(false));

// New: working question index (furthest question user has progressed to)
const [workingQuestionIndex, setWorkingQuestionIndex] = useState(0);

// New: viewing question index (current question being displayed)
const [viewingQuestionIndex, setViewingQuestionIndex] = useState(0);
```

#### 5. Navigation Flow

**Scenario 1: User Navigates Before Answering**
```
1. User is on Q3 (unanswered)
2. User clicks Previous
3. Auto-save partial answer (if any)
4. Show Q2
5. Navigation buttons remain visible
```

**Scenario 2: User Navigates After Answering**
```
1. User is on Q5 (answered and submitted)
2. User clicks Previous
3. Show Q4 with previous answer and result
4. User can review but not change
5. Click Next to return to Q5 or jump to working question
```

**Scenario 3: User Navigates Forward**
```
1. User is on Q3 (working question)
2. User clicks Next without answering
3. Auto-save partial answer (if any)
4. Show Q4
5. Working question remains Q3
6. Home button is now active (shows "返回第3题")
```

#### 6. UI Layout

**Desktop:**
```
[← 返回]  [━━━━━━━━━ 60% ━━━━━━━━━]  [◀] [🏠] [▶]  [单选 • 5/20 ✓]  [🔊]  [结束练习]
```

**Mobile:**
```
[← 返回]                                    [◀] [🏠] [▶]  [5/20 ✓]  [结束练习]

进度 60%
[━━━━━━━━━━━━━━━━━━]
```

### Implementation Changes

#### QuizHeader.tsx
- Remove conditional rendering: `{(answers[currentQuestionIndex] !== null) ? ... : null}`
- Always render navigation button group
- Update disabled logic:
  ```typescript
  disabled={viewingQuestionIndex === 0}  // Previous
  disabled={viewingQuestionIndex === workingQuestionIndex}  // Home
  disabled={viewingQuestionIndex === totalQuestions - 1}  // Next
  ```

#### QuizPracticeMain.tsx
- Add auto-save logic when navigating
- Track viewing vs working question indices
- Update state management for partial answers
- Modify `handleNavigateToPrevious`, `handleNavigateToNext`, `handleJumpToWorking`

### User Benefits
1. ✅ Free navigation at any time
2. ✅ Review previous answers easily
3. ✅ No lost work when navigating
4. ✅ Clear indication of progress (checkmarks)
5. ✅ Always know where you are (working question vs viewing)
6. ✅ Easy to return to working question (Home button)

### Edge Cases
1. **Navigate without any input**: Allow, no data lost
2. **Navigate with partial input**: Auto-save, user can return
3. **Navigate to already-answered question**: Show result, allow review
4. **Navigate past working question**: Update working question index
5. **Rapid navigation**: Debounce or queue state updates

## Future Enhancements (Optional)
- Question overview grid (click any question to jump)
- Keyboard shortcuts (←/→ arrows, Home key)
- Progress indicator showing answered count
- "Mark for review" flag for uncertain answers
