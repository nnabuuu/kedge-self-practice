# Spec: Wrong-Only Practice Mode

## Overview

The wrong-only practice mode (错题强化) allows students to review quizzes they answered incorrectly in their **last 5 practice sessions**.

## MODIFIED Requirements

### Requirement: Session Limit for Wrong Questions

The system MUST only collect wrong questions from the user's **last 5 completed practice sessions**.

#### Scenario: User has more than 5 sessions

**Given** a user has completed 10 practice sessions
**And** session 1-5 (oldest) have wrong answers for Quiz A, B, C
**And** session 6-10 (newest) have wrong answers for Quiz D, E, F
**When** the user starts a wrong-only practice session
**Then** only Quiz D, E, F should be candidates
**Because** only the last 5 sessions (6-10) are considered

#### Scenario: User has fewer than 5 sessions

**Given** a user has completed only 3 practice sessions
**And** those sessions have wrong answers for Quiz A, B
**When** the user starts a wrong-only practice session
**Then** Quiz A, B should be candidates
**Because** all available sessions are within the 5-session window

#### Scenario: User has no wrong answers in last 5 sessions

**Given** a user has completed 10 practice sessions
**And** the last 5 sessions have 100% correct answers
**And** sessions 1-5 have wrong answers
**When** the user starts a wrong-only practice session
**Then** no quizzes should be returned
**And** the system shows "暂无错题记录"
**Because** only the last 5 sessions are considered

### Requirement: Deduplication

The system MUST deduplicate wrong questions - each quiz appears only once regardless of how many times it was answered incorrectly.

#### Scenario: Same quiz wrong multiple times

**Given** a user answered Quiz A incorrectly in sessions 6, 7, and 8
**When** the user starts a wrong-only practice session
**Then** Quiz A should appear only once
**Because** quizzes are deduplicated

### Requirement: Filter Support

The system MUST support knowledge point and quiz type filters with the 5-session limit.

#### Scenario: Filtering wrong quizzes by knowledge point

**Given** a user has wrong Quiz A (Physics) in session 10
**And** wrong Quiz B (Chemistry) in session 9
**When** filtered to Physics only
**Then** only Quiz A should appear
