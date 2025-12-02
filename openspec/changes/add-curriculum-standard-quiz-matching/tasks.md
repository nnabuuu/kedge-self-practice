# Implementation Tasks

## 1. Models and Schemas
- [ ] 1.1 Create `CurriculumStandardMatchResultSchema` in models package
- [ ] 1.2 Define `CurriculumStandardCandidateSchema` with confidence scores
- [ ] 1.3 Define `CurriculumStandardExtractedMetadataSchema` for GPT extraction
- [ ] 1.4 Extend `QuizWithKnowledgePointSchema` to include curriculum standard matching (or create new schema)
- [ ] 1.5 Export new schemas from models package index

## 2. Curriculum Standard Matching Service
- [ ] 2.1 Create `curriculum-standard-matching.service.ts` in knowledge-point package
- [ ] 2.2 Implement `extractCurriculumMetadata(quizText)` using GPT
- [ ] 2.3 Implement `suggestCurriculumStandards(metadata, filters)` to query and rank candidates
- [ ] 2.4 Implement `matchQuizToCurriculumStandard(quiz)` combining extraction and suggestion
- [ ] 2.5 Implement `batchMatchQuizzes(quizzes)` for bulk processing
- [ ] 2.6 Add confidence scoring logic for ranking candidates
- [ ] 2.7 Handle cases with no available curriculum standards gracefully

## 3. GPT Integration
- [ ] 3.1 Create GPT prompt template for curriculum standard extraction
- [ ] 3.2 Design JSON schema for GPT response (subject, course_content, keywords, hierarchy hints)
- [ ] 3.3 Implement GPT call with structured output parsing
- [ ] 3.4 Add error handling and fallback for GPT failures
- [ ] 3.5 Implement GPT-based curriculum standard selection from candidates
- [ ] 3.6 Add logging for GPT token usage and performance

## 4. Quiz Service Updates
- [ ] 4.1 Add method to update quiz `curriculum_standard_id` in quiz service
- [ ] 4.2 Implement validation that curriculum standard exists before assignment
- [ ] 4.3 Add method to clear curriculum standard assignment
- [ ] 4.4 Update quiz repository queries to include curriculum standard joins
- [ ] 4.5 Add method to query quizzes by curriculum standard ID

## 5. DOCX Controller Enhancement
- [ ] 5.1 Update `extract-quiz-with-images` endpoint to include curriculum standard matching
- [ ] 5.2 Call curriculum standard matching service for each extracted quiz
- [ ] 5.3 Include curriculum_standard_match_result in response schema
- [ ] 5.4 Ensure backward compatibility when no curriculum standards exist
- [ ] 5.5 Add error handling for curriculum matching failures (continue with quiz parsing)
- [ ] 5.6 Update Swagger documentation for enhanced response

## 6. Curriculum Standard Controller Extensions
- [ ] 6.1 Add POST /v1/curriculum-standards/match-quiz endpoint
- [ ] 6.2 Add POST /v1/curriculum-standards/batch-match-quizzes endpoint
- [ ] 6.3 Add PATCH /v1/quizzes/:id/curriculum-standard endpoint for manual assignment
- [ ] 6.4 Add DELETE /v1/quizzes/:id/curriculum-standard endpoint to clear assignment
- [ ] 6.5 Add authentication guards (TeacherGuard for write operations)
- [ ] 6.6 Add request validation with Zod schemas
- [ ] 6.7 Add Swagger documentation for new endpoints

## 7. Module Registration
- [ ] 7.1 Register `CurriculumStandardMatchingService` in KnowledgePointModule
- [ ] 7.2 Export service from knowledge-point package index
- [ ] 7.3 Ensure service has access to GPT/LLM configuration
- [ ] 7.4 Wire service into DOCX controller

## 8. Testing
- [ ] 8.1 Write unit tests for curriculum metadata extraction
- [ ] 8.2 Write unit tests for curriculum standard suggestion logic
- [ ] 8.3 Write integration tests for quiz matching endpoints
- [ ] 8.4 Test DOCX parsing with curriculum standard matching enabled
- [ ] 8.5 Test batch matching with multiple quizzes
- [ ] 8.6 Test edge cases (no curriculum standards, GPT failures, invalid quiz content)
- [ ] 8.7 Test parallel matching (knowledge points + curriculum standards)
- [ ] 8.8 Test manual assignment and reassignment flows

## 9. Performance Optimization
- [ ] 9.1 Implement caching for curriculum standard queries
- [ ] 9.2 Add batch GPT requests to reduce API calls
- [ ] 9.3 Optimize database queries for curriculum standard filtering
- [ ] 9.4 Add rate limiting for GPT matching requests
- [ ] 9.5 Implement async processing for large batch matches

## 10. Documentation
- [ ] 10.1 Document GPT prompt design and expected response format
- [ ] 10.2 Add API documentation for new endpoints
- [ ] 10.3 Document matching algorithm and confidence scoring
- [ ] 10.4 Add examples to Swagger for curriculum standard matching
- [ ] 10.5 Update CLAUDE.md with curriculum standard matching architecture

## 11. Build and Validation
- [ ] 11.1 Run `nx run-many --target=build --all` to verify type safety
- [ ] 11.2 Run all tests with `nx run-many --target=test --all`
- [ ] 11.3 Fix any type errors or test failures
- [ ] 11.4 Run linter and format code
- [ ] 11.5 Test end-to-end flow with sample DOCX file
