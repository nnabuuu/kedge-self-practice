# Add Curriculum Standard Quiz Matching

## Why

The current quiz parsing flow only supports matching quizzes to knowledge points (informal, textbook-based organization). With the introduction of curriculum standards (课程标准), teachers need the ability to associate parsed quizzes with official curriculum standards during the DOCX parsing process. This enables alignment of quiz questions with official educational standards (内容要求, 学业要求) for better curriculum compliance and practice targeting.

Currently, the knowledge point matching uses GPT-based keyword extraction (`KnowledgePointGPTService.extractKeywordsFromQuiz`) to match quizzes to knowledge points. We need a parallel matching mechanism for curriculum standards that operates independently and can suggest curriculum standards based on quiz content.

## What Changes

- **NEW**: Add curriculum standard matching service (`CurriculumStandardMatchingService`) parallel to existing knowledge point matching
- **NEW**: Implement GPT-based curriculum standard suggestion using quiz content and available curriculum standards
- **NEW**: Add Zod schemas for curriculum standard matching results and suggestions
- **NEW**: Extend quiz parsing API responses to include curriculum standard matching data alongside knowledge point matching
- **NEW**: Add controller endpoints to manually match/rematch quizzes with curriculum standards
- **NON-BREAKING**: Existing knowledge point matching continues to work independently
- **NEW**: Store both `knowledge_point_id` and `curriculum_standard_id` on quiz records (already supported via migration in `add-curriculum-standards`)

## Impact

### Affected Specs
- **NEW capability**: `quiz-curriculum-matching` - Curriculum standard matching for parsed quizzes
- **MODIFIED capability**: Extends quiz parsing flow to include curriculum standard suggestions

### Affected Code
- `backend/packages/libs/knowledge-point/src/lib/` - New `curriculum-standard-matching.service.ts`
- `backend/packages/libs/models/src/practice/` - New schemas for curriculum matching results
- `backend/packages/apps/api-server/src/app/controllers/docx.controller.ts` - Enhanced responses with curriculum matching
- `backend/packages/apps/api-server/src/app/controllers/curriculum-standard.controller.ts` - New matching endpoints
- `backend/packages/libs/quiz/src/lib/` - Quiz service updates to support curriculum standard assignment

### Dependencies
- Requires `add-curriculum-standards` change to be implemented (database table and basic CRUD)
- Uses existing GPT/LLM infrastructure from `KnowledgePointGPTService`
- No breaking changes to existing quiz parsing or knowledge point matching

### User Workflow
1. Teacher uploads DOCX file with quiz questions
2. System parses quizzes and extracts content
3. **NEW**: System suggests curriculum standards for each quiz using GPT (in addition to knowledge point matching)
4. Teacher reviews suggested curriculum standards and confirms/adjusts
5. Quiz is saved with both `knowledge_point_id` and `curriculum_standard_id` references
