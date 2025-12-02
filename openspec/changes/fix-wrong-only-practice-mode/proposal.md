# Proposal: Fix Wrong-Only Practice Mode

## Problem Statement

When users select "错题强化" (wrong-only practice mode), they may see the same quizzes repeatedly because the system considers all historical wrong answers. Users expect wrong questions to be based on recent practice only.

## Proposed Solution

1. **Backend**: Limit wrong question collection to the **latest 5 practice sessions** only
2. **Frontend**: Add a help icon (`?`) with tooltip "仅考虑最近5次练习" to clarify this behavior

## Scope

- **Backend**: Modify `getWrongQuizzesForUser()` to only look at the last 5 sessions
- **Frontend**: Add tooltip hint to the "错题强化" button in `PracticeMenu.tsx`

## Success Criteria

1. Wrong-only mode only considers quizzes from the user's last 5 practice sessions
2. Users can see a clear hint explaining this behavior via the `?` icon tooltip
