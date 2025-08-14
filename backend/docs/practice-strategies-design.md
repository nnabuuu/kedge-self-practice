# Practice Strategies Design Document

## Overview
This document defines the practice strategy system for the Kedge self-practice learning platform. The system provides different practice strategies to help middle school students enhance their learning experience through targeted practice sessions.

## Practice Strategies

### 1. 快速练习 (Quick Practice)
**Strategy Code**: `QUICK_PRACTICE`
**Purpose**: Allows students to quickly start a practice session with random questions
**Features**:
- Random selection of questions from selected knowledge points
- Default time limit per question (configurable)
- Mix of different difficulty levels
- Immediate feedback after each question

**Algorithm**:
```
1. Select knowledge point range
2. Randomly select N questions from the pool
3. Ensure diversity in difficulty (33% easy, 34% medium, 33% hard)
4. Shuffle question order
5. Apply default time limits
```

### 2. 薄弱点强化 (Weakness Reinforcement)
**Strategy Code**: `WEAKNESS_REINFORCEMENT`
**Purpose**: Focus on knowledge points where the student has poor performance
**Features**:
- Analyzes student's historical performance
- Identifies knowledge points with accuracy < 60%
- Prioritizes questions from weak areas
- Progressive difficulty adjustment
- More practice questions from weak areas

**Algorithm**:
```
1. Analyze last 30 days of practice history
2. Calculate accuracy rate per knowledge point
3. Identify knowledge points with accuracy < 60%
4. Weight selection: 70% from weak points, 30% mixed
5. Start with easier questions, progressively increase difficulty
6. Track improvement in real-time
```

### 3. 错题强化 (Mistake Reinforcement)
**Strategy Code**: `MISTAKE_REINFORCEMENT`
**Purpose**: Practice previously incorrect answers to reinforce learning
**Features**:
- Tracks all incorrect answers
- Provides similar questions to incorrect ones
- Spaced repetition algorithm
- Detailed explanations for corrections
- Progress tracking for mistake correction

**Algorithm**:
```
1. Retrieve student's mistake history
2. Group mistakes by knowledge point and question type
3. Generate similar questions (80% similar, 20% exact repeat)
4. Apply spaced repetition intervals (1, 3, 7, 14, 30 days)
5. Track correction rate
6. Graduate questions after 3 consecutive correct answers
```

## API Design

### Endpoints

#### 1. Get Available Strategies
```
GET /api/v1/practice/strategies
```
**Response**:
```json
{
  "strategies": [
    {
      "code": "QUICK_PRACTICE",
      "name": "快速练习",
      "description": "Random practice with mixed questions",
      "icon": "flash",
      "recommended": false,
      "requiredHistory": false
    },
    {
      "code": "WEAKNESS_REINFORCEMENT",
      "name": "薄弱点强化",
      "description": "Focus on your weak knowledge points",
      "icon": "target",
      "recommended": true,
      "requiredHistory": true,
      "minimumPracticeCount": 20
    },
    {
      "code": "MISTAKE_REINFORCEMENT",
      "name": "错题强化",
      "description": "Practice your previous mistakes",
      "icon": "refresh",
      "recommended": false,
      "requiredHistory": true,
      "minimumMistakeCount": 5
    }
  ]
}
```

#### 2. Generate Practice Session
```
POST /api/v1/practice/generate
```
**Request**:
```json
{
  "strategyCode": "WEAKNESS_REINFORCEMENT",
  "knowledgePointIds": ["kp_001", "kp_002"],
  "questionCount": 20,
  "timeLimit": 1800,
  "difficulty": "AUTO",
  "options": {
    "includeExplanations": true,
    "allowSkip": false
  }
}
```

**Response**:
```json
{
  "sessionId": "ps_123456",
  "strategy": "WEAKNESS_REINFORCEMENT",
  "questions": [...],
  "metadata": {
    "totalQuestions": 20,
    "estimatedTime": 1800,
    "difficultyDistribution": {
      "easy": 6,
      "medium": 8,
      "hard": 6
    },
    "knowledgePointDistribution": {
      "kp_001": 12,
      "kp_002": 8
    }
  }
}
```

#### 3. Get Strategy Recommendations
```
GET /api/v1/practice/recommendations/:studentId
```
**Response**:
```json
{
  "primaryRecommendation": {
    "strategyCode": "WEAKNESS_REINFORCEMENT",
    "reason": "You have 3 weak knowledge points that need attention",
    "weakPoints": [
      {
        "knowledgePointId": "kp_001",
        "name": "Quadratic Equations",
        "accuracy": 45,
        "practiceCount": 15
      }
    ]
  },
  "alternativeRecommendations": [
    {
      "strategyCode": "MISTAKE_REINFORCEMENT",
      "reason": "You have 23 uncorrected mistakes"
    }
  ]
}
```

#### 4. Get Strategy Analytics
```
GET /api/v1/practice/analytics/:studentId/:strategyCode
```
**Response**:
```json
{
  "strategyCode": "WEAKNESS_REINFORCEMENT",
  "usage": {
    "totalSessions": 15,
    "lastUsed": "2024-01-15T10:30:00Z",
    "averageScore": 72.5,
    "improvement": 15.3
  },
  "effectiveness": {
    "weakPointsImproved": 5,
    "weakPointsRemaining": 2,
    "averageImprovementRate": 23.5
  }
}
```

## Database Schema

### practice_strategies
```sql
CREATE TABLE practice_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    required_history BOOLEAN DEFAULT false,
    minimum_practice_count INTEGER DEFAULT 0,
    minimum_mistake_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### practice_sessions
```sql
CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    strategy_code VARCHAR(50) REFERENCES practice_strategies(code),
    knowledge_point_ids UUID[],
    question_ids UUID[],
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    total_questions INTEGER,
    correct_answers INTEGER,
    time_spent INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### student_weaknesses
```sql
CREATE TABLE student_weaknesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    knowledge_point_id UUID REFERENCES knowledge_points(id),
    accuracy_rate DECIMAL(5,2),
    practice_count INTEGER,
    last_practiced TIMESTAMP,
    improvement_trend DECIMAL(5,2),
    is_weak BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, knowledge_point_id)
);
```

### student_mistakes
```sql
CREATE TABLE student_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    quiz_id UUID REFERENCES quizzes(id),
    session_id UUID REFERENCES practice_sessions(id),
    incorrect_answer TEXT,
    correct_answer TEXT,
    mistake_count INTEGER DEFAULT 1,
    last_attempted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_corrected BOOLEAN DEFAULT false,
    correction_count INTEGER DEFAULT 0,
    next_review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create database migrations for new tables
2. Define TypeScript models and Zod schemas
3. Implement basic strategy service

### Phase 2: Strategy Implementation
1. Implement Quick Practice algorithm
2. Implement Weakness Reinforcement algorithm
3. Implement Mistake Reinforcement algorithm

### Phase 3: Analytics & Optimization
1. Add performance tracking
2. Implement recommendation engine
3. Add spaced repetition algorithm

### Phase 4: Integration
1. Integrate with existing quiz system
2. Update frontend to use new strategies
3. Add real-time progress tracking

## Configuration

### Environment Variables
```bash
# Strategy Configuration
STRATEGY_WEAKNESS_THRESHOLD=60  # Accuracy % below which a point is considered weak
STRATEGY_MISTAKE_GRADUATION=3    # Consecutive correct answers to graduate a mistake
STRATEGY_SPACED_INTERVALS="1,3,7,14,30"  # Days for spaced repetition
STRATEGY_DEFAULT_QUESTION_COUNT=20
STRATEGY_DEFAULT_TIME_LIMIT=1800  # seconds
```

### Strategy Weights
```typescript
interface StrategyWeights {
  QUICK_PRACTICE: {
    easy: 0.33,
    medium: 0.34,
    hard: 0.33
  },
  WEAKNESS_REINFORCEMENT: {
    weakPoints: 0.70,
    mixed: 0.30,
    difficultyProgression: 'ascending'
  },
  MISTAKE_REINFORCEMENT: {
    similar: 0.80,
    exact: 0.20,
    spacedRepetition: true
  }
}
```

## Success Metrics

1. **Engagement Metrics**
   - Strategy usage frequency
   - Session completion rate
   - Average time per session

2. **Learning Metrics**
   - Accuracy improvement rate
   - Weakness reduction rate
   - Mistake correction rate

3. **User Satisfaction**
   - Strategy preference distribution
   - Session abandonment rate
   - Feature usage patterns

## Security Considerations

1. **Data Privacy**
   - Student performance data is sensitive
   - Implement proper access controls
   - Audit trail for data access

2. **Algorithm Fairness**
   - Ensure strategies don't create bias
   - Regular algorithm audits
   - Transparent recommendation logic

## Future Enhancements

1. **AI-Powered Recommendations**
   - Machine learning for personalized strategies
   - Predictive analytics for learning paths
   - Natural language explanations

2. **Gamification**
   - Achievement system for strategy mastery
   - Leaderboards for motivation
   - Streak tracking

3. **Collaborative Learning**
   - Peer comparison for strategies
   - Group practice sessions
   - Strategy sharing among students