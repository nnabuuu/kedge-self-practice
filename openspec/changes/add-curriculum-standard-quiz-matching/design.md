# Design: Curriculum Standard Quiz Matching

## Context

The system currently supports matching quizzes to informal knowledge points during DOCX parsing using GPT-based keyword extraction (`KnowledgePointGPTService`). With the introduction of official curriculum standards (课程标准), we need a parallel matching mechanism that associates quizzes with curriculum standards independently.

**Current flow**:
1. Teacher uploads DOCX → quizzes extracted
2. GPT extracts keywords from quiz → matches to knowledge points
3. Teacher reviews and confirms knowledge point
4. Quiz saved with `knowledge_point_id`

**New requirement**: Add curriculum standard matching in parallel without breaking existing knowledge point matching.

**Stakeholders**: Teachers (assign curriculum standards), Students (practice aligned to standards), System (maintain dual matching)

**Constraints**:
- Must not break existing knowledge point matching
- GPT API rate limits and token costs
- Curriculum standards may not exist for all subjects initially
- Must work with existing quiz schema (database already supports `curriculum_standard_id` column)

## Goals / Non-Goals

### Goals
- Parallel curriculum standard matching alongside knowledge point matching
- GPT-based intelligent suggestion of curriculum standards from quiz content
- Manual assignment and reassignment of curriculum standards to quizzes
- Batch processing for multiple quizzes
- Confidence scoring for curriculum standard suggestions
- API extensions for curriculum standard matching without breaking existing endpoints

### Non-Goals
- Replacing knowledge point matching (both systems coexist)
- Real-time curriculum standard matching for practice sessions (matching happens during upload/assignment)
- Automatic assignment without teacher review (always requires confirmation)
- Multi-curriculum-standard per quiz (one-to-one relationship for now)
- Frontend UI implementation (API-only)

## Decisions

### Decision 1: Parallel Matching Service
**Choice**: Create `CurriculumStandardMatchingService` parallel to `KnowledgePointGPTService` rather than extending existing service.

**Rationale**:
- Curriculum standards have different structure (metadata, hierarchy levels) than knowledge points
- Matching logic differs: curriculum standards use official terminology vs. informal textbook organization
- Keeps services focused and maintainable
- Allows independent evolution of both matching algorithms

**Implementation**:
```typescript
// Separate service
class CurriculumStandardMatchingService {
  async extractCurriculumMetadata(quiz): Promise<CurriculumMetadata>
  async suggestCurriculumStandards(metadata): Promise<CurriculumStandard[]>
  async matchQuizToCurriculumStandard(quiz): Promise<MatchResult>
}

// Parallel calls in DOCX controller
const knowledgePointMatch = await knowledgePointGPTService.match(quiz);
const curriculumMatch = await curriculumMatchingService.match(quiz);
```

**Alternatives considered**:
1. ❌ Extend `KnowledgePointGPTService` to handle both: Too complex, violates single responsibility
2. ❌ Unified matching service: Different data structures make this awkward
3. ✅ Separate parallel service: Clean separation, independent testing, easier maintenance

### Decision 2: GPT Extraction Strategy
**Choice**: Use GPT to extract subject, course_content category, and hierarchy keywords, then match against database curriculum standards.

**Two-phase approach**:
1. **Phase 1**: GPT extracts metadata from quiz (subject, course_content, keywords)
2. **Phase 2**: Query database curriculum standards filtered by metadata and rank by keyword similarity

**Rationale**:
- GPT is good at understanding quiz content and extracting semantic meaning
- Database query is efficient for filtering by exact metadata matches
- Keyword matching can use simple similarity algorithms (no need for embeddings initially)
- Reduces GPT token usage (don't send entire curriculum standard database to GPT)

**GPT Prompt Structure**:
```
You are an education expert analyzing quiz questions to extract curriculum standard metadata.

Given this quiz question, extract:
- subject: The academic subject (物理, 历史, 生物, etc.)
- course_content: The broad curriculum content category (物质, 能量, 运动和相互作用, etc.)
- keywords: 3-5 keywords representing the specific topic (固态, 液态, 气态, 密度, etc.)
- grade_level_hint: Educational stage indicator if detectable

Quiz:
[question text]

Return structured JSON.
```

**Alternatives considered**:
1. ❌ Send all curriculum standards to GPT and ask it to choose: Token expensive, slow
2. ❌ Embedding-based semantic search: Over-engineering for initial version
3. ✅ Extract metadata → filter database → keyword ranking: Simple, cost-effective, accurate enough

### Decision 3: Confidence Scoring
**Choice**: Implement simple confidence scoring based on metadata + keyword matching.

**Scoring algorithm**:
```
confidence_score = (
  subject_match ? 0.3 : 0 +
  course_content_match ? 0.3 : 0 +
  keyword_similarity * 0.4
)

keyword_similarity = (matching_keywords / total_keywords)
```

**Rationale**:
- Subject and course_content are strong signals (exact match required)
- Keywords provide fine-grained differentiation
- Simple algorithm, easy to tune
- Returns top 3-5 candidates ranked by score

**Alternatives considered**:
1. ❌ Binary match/no-match: Not helpful for teacher review
2. ❌ Machine learning model: Over-engineering, requires training data
3. ✅ Weighted scoring: Simple, interpretable, good enough for MVP

### Decision 4: Response Schema Structure
**Choice**: Extend quiz parsing response with `curriculum_standard_match_result` field alongside existing `knowledge_point_match_result`.

**Schema**:
```typescript
interface QuizWithMatches {
  ...QuizItem,
  knowledgePoint?: KnowledgePoint,
  knowledgePointMatchResult?: KnowledgePointMatchResult,
  curriculumStandard?: CurriculumStandard, // NEW
  curriculumStandardMatchResult?: CurriculumStandardMatchResult, // NEW
}

interface CurriculumStandardMatchResult {
  candidates: CurriculumStandardCandidate[],
  extractedMetadata: {
    subject: string,
    course_content: string,
    keywords: string[],
  },
  matchingStatus: 'success' | 'no_match' | 'error',
}

interface CurriculumStandardCandidate {
  curriculumStandard: CurriculumStandard,
  confidence: number,
  matchingReason: string,
}
```

**Rationale**:
- Parallel structure to knowledge point matching (familiar pattern)
- Non-breaking: existing clients ignore new fields
- Provides candidates for teacher review
- Includes metadata for transparency

### Decision 5: Manual Assignment Flow
**Choice**: Provide explicit endpoints for manual curriculum standard assignment separate from quiz CRUD.

**Endpoints**:
- `PATCH /v1/quizzes/:id/curriculum-standard` - Assign curriculum standard
- `DELETE /v1/quizzes/:id/curriculum-standard` - Clear assignment
- `POST /v1/curriculum-standards/match-quiz` - Get suggestions without saving
- `POST /v1/curriculum-standards/batch-match-quizzes` - Batch suggestions

**Rationale**:
- Clear intent: curriculum standard assignment is a separate action
- Follows RESTful sub-resource pattern
- Allows getting suggestions without modifying quiz
- Batch endpoint supports bulk operations

**Alternatives considered**:
1. ❌ Include in quiz update endpoint: Mixes concerns, less discoverable
2. ❌ Only allow assignment during DOCX upload: Inflexible, can't reassign later
3. ✅ Dedicated sub-resource endpoints: Clear, flexible, testable

## Risks / Trade-offs

### Risk: GPT Token Costs
**Mitigation**:
- Cache curriculum metadata extraction for identical quiz text
- Batch multiple quizzes in single GPT call when possible
- Implement rate limiting per user/teacher
- Monitor GPT usage and add budget alerts

### Risk: No Curriculum Standards for Subject
**Mitigation**:
- Check if curriculum standards exist before attempting matching
- Return empty match result with clear message
- Allow graceful degradation (knowledge point matching still works)
- Provide teacher feedback to import curriculum standards first

### Risk: Matching Accuracy
**Mitigation**:
- Always return top 3-5 candidates (not auto-assigning)
- Provide matching reason and confidence score for transparency
- Allow manual override and feedback collection
- Iterate on GPT prompts based on real-world performance

### Trade-off: Dual Matching Complexity
**Trade-off**: Supporting both knowledge point and curriculum standard matching adds complexity.

**Justification**:
- Different use cases: informal teacher organization vs. official standards
- Curriculum standard adoption will be gradual
- Some subjects may only have knowledge points initially
- Parallel systems allow independent evolution

**Future**: May merge or deprecate knowledge points once curriculum standards cover all subjects.

## Migration Plan

### Phase 1: Core Matching Service (This Change)
1. Implement `CurriculumStandardMatchingService` with GPT extraction
2. Add matching logic and confidence scoring
3. Create new Zod schemas for match results
4. Write unit tests for matching service

### Phase 2: API Integration
1. Extend DOCX controller to include curriculum standard matching
2. Add manual assignment endpoints
3. Update quiz service to support curriculum standard updates
4. Add Swagger documentation

### Phase 3: Batch Operations
1. Implement batch matching endpoint
2. Add bulk assignment capabilities
3. Optimize GPT API usage for batches

### Phase 4: Optimization (Future)
1. Add caching for curriculum standard queries
2. Implement embedding-based search if accuracy needs improvement
3. Add teacher feedback loop to improve matching

### Rollback Plan
- No database schema changes (curriculum_standard_id column already exists)
- New service can be disabled via feature flag
- Existing knowledge point matching unaffected
- If matching fails, quiz parsing continues without curriculum standard suggestions

## Open Questions

1. **Should we auto-assign high-confidence matches (e.g., confidence > 0.9)?**
   - **Proposed**: No, always require teacher confirmation for transparency and control

2. **How many candidates should we return (3, 5, 10)?**
   - **Proposed**: Return top 5 candidates, configurable per request

3. **Should batch matching process synchronously or asynchronously?**
   - **Proposed**: Synchronous for <20 quizzes, async job for larger batches

4. **How to handle curriculum standard updates/deletions with assigned quizzes?**
   - **Proposed**: ON DELETE SET NULL (already configured in migration), notify teachers of orphaned quizzes

5. **Should we support multi-curriculum-standard per quiz?**
   - **Decision**: Not in MVP, stick with one-to-one relationship, extend to many-to-many if needed later
