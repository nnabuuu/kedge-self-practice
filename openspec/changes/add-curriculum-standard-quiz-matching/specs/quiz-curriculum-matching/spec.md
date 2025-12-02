# Quiz Curriculum Standard Matching Specification

## ADDED Requirements

### Requirement: Curriculum Standard Extraction from Quiz Content
The system SHALL extract relevant curriculum standards from quiz question content using GPT-based analysis.

#### Scenario: Extract curriculum standard keywords from physics quiz
- **GIVEN** A quiz question about "物质的形态和变化" (states of matter and changes)
- **WHEN** the system analyzes the quiz content using GPT
- **THEN** return extracted metadata including subject, course_content, and hierarchy level keywords
- **AND** metadata includes key terms from the question that match curriculum standard terminology

#### Scenario: Extract curriculum standard from multi-choice quiz with context
- **GIVEN** A quiz with question text, options, and correct answer about curriculum topics
- **WHEN** the extraction service processes the quiz
- **THEN** identify the subject area (e.g., 物理, 历史, 生物)
- **AND** identify course content category (e.g., 物质, 能量, 运动和相互作用)
- **AND** extract hierarchy keywords for matching

#### Scenario: Handle quiz without clear curriculum standard
- **GIVEN** A quiz question with generic content not matching any curriculum standard
- **WHEN** GPT extraction attempts to identify curriculum standards
- **THEN** return empty or low-confidence suggestions
- **AND** allow manual curriculum standard assignment

### Requirement: Curriculum Standard Suggestion
The system SHALL suggest matching curriculum standards for a quiz based on extracted metadata and available curriculum standards in the database.

#### Scenario: Suggest curriculum standards for physics quiz
- **GIVEN** A quiz with extracted metadata: subject="物理", course_content="物质", keywords=["固态", "液态", "气态"]
- **AND** curriculum standards exist in the database for 物理 subject
- **WHEN** the suggestion service queries for matches
- **THEN** return top 3-5 curriculum standard candidates ranked by relevance
- **AND** each candidate includes curriculum standard details and matching confidence score

#### Scenario: Filter suggestions by grade level
- **GIVEN** Quiz metadata indicating middle school level content
- **WHEN** suggesting curriculum standards
- **THEN** prioritize standards with grade_level matching "义务教育阶段第四学段"
- **AND** exclude standards for other grade levels

#### Scenario: No matching curriculum standards found
- **GIVEN** A quiz question about a topic with no curriculum standards in database
- **WHEN** the suggestion service queries
- **THEN** return empty candidates list
- **AND** provide reason indicating no matches found

### Requirement: Quiz-Curriculum Standard Association
The system SHALL support associating quizzes with curriculum standards during and after parsing.

#### Scenario: Associate quiz with curriculum standard during DOCX parsing
- **GIVEN** A DOCX file being parsed with quiz questions
- **WHEN** quizzes are extracted and curriculum standards are suggested
- **THEN** each quiz includes suggested curriculum standard in the response
- **AND** teacher can confirm or modify the curriculum standard before saving

#### Scenario: Manually assign curriculum standard to existing quiz
- **GIVEN** An existing quiz with no curriculum_standard_id
- **WHEN** PATCH /v1/quizzes/:id with curriculum_standard_id
- **THEN** update the quiz record with the curriculum standard reference
- **AND** validate that the curriculum standard exists

#### Scenario: Update quiz curriculum standard assignment
- **GIVEN** A quiz already associated with curriculum standard A
- **WHEN** teacher assigns curriculum standard B
- **THEN** replace the old assignment with new curriculum_standard_id
- **AND** return updated quiz with new curriculum standard

### Requirement: Parallel Matching for Knowledge Points and Curriculum Standards
The system SHALL support matching both knowledge points and curriculum standards independently for the same quiz.

#### Scenario: Quiz matched to both knowledge point and curriculum standard
- **GIVEN** A quiz question about "物质的密度"
- **WHEN** parsing and matching occurs
- **THEN** system suggests knowledge point from informal textbook organization
- **AND** system suggests curriculum standard from official 课程标准
- **AND** both suggestions are included in the parsing response
- **AND** teacher can choose one, both, or neither

#### Scenario: Save quiz with both references
- **GIVEN** Teacher confirms both knowledge point and curriculum standard for a quiz
- **WHEN** saving the quiz
- **THEN** store both knowledge_point_id and curriculum_standard_id
- **AND** both relationships are queryable

#### Scenario: Query quizzes by curriculum standard
- **GIVEN** Multiple quizzes associated with a specific curriculum standard
- **WHEN** GET /v1/curriculum-standards/:id/quizzes
- **THEN** return all quizzes with that curriculum_standard_id
- **AND** include quiz details and knowledge point references if present

### Requirement: GPT-Based Curriculum Standard Matching Service
The system SHALL provide a service using GPT to intelligently match quiz content to curriculum standards.

#### Scenario: Use GPT to analyze quiz and suggest curriculum standards
- **GIVEN** A quiz question text and available curriculum standards
- **WHEN** GPT matching service is invoked
- **THEN** send quiz content and curriculum standard samples to GPT
- **AND** receive structured response with suggested curriculum standard ID and reasoning
- **AND** confidence score indicating match quality

#### Scenario: Batch match multiple quizzes from DOCX
- **GIVEN** 20 quizzes extracted from uploaded DOCX file
- **WHEN** batch curriculum standard matching is requested
- **THEN** process each quiz sequentially or in parallel
- **AND** return curriculum standard suggestions for all quizzes
- **AND** handle rate limiting and errors gracefully

#### Scenario: GPT matching with limited curriculum standards
- **GIVEN** Only 50 curriculum standards exist for a subject
- **WHEN** GPT matching analyzes a quiz
- **THEN** provide all relevant standards as context to GPT
- **AND** GPT selects best match from available options

### Requirement: Curriculum Standard Match Result Schema
The system SHALL provide structured match results with curriculum standard candidates and metadata.

#### Scenario: Return curriculum standard match result with candidates
- **GIVEN** A quiz has been analyzed for curriculum standard matching
- **WHEN** the match result is returned
- **THEN** include list of curriculum standard candidates
- **AND** each candidate has curriculum standard details (id, grade_level, subject, hierarchy_levels)
- **AND** each candidate has confidence score and matching reason
- **AND** include extracted keywords used for matching

#### Scenario: Match result indicates no confidence
- **GIVEN** GPT cannot confidently match quiz to any curriculum standard
- **WHEN** returning match result
- **THEN** candidates list is empty
- **AND** matching status indicates low confidence or no match
- **AND** provide human-readable reason

### Requirement: API Response Enhancement
The system SHALL enhance existing quiz parsing API responses to include curriculum standard matching data.

#### Scenario: DOCX parsing includes curriculum standard suggestions
- **GIVEN** Teacher uploads DOCX via POST /docx/extract-quiz-with-images
- **WHEN** quizzes are parsed and extracted
- **THEN** response includes curriculum_standard_match_result for each quiz
- **AND** curriculum_standard_match_result includes suggested standards
- **AND** existing knowledge point matching data is still included

#### Scenario: Legacy quiz parsing without curriculum standards
- **GIVEN** System has no curriculum standards in database
- **WHEN** DOCX parsing occurs
- **THEN** curriculum_standard_match_result is null or empty
- **AND** knowledge point matching still works normally
- **AND** quiz parsing does not fail

### Requirement: Manual Curriculum Standard Rematch
The system SHALL provide endpoints to manually trigger curriculum standard matching for existing quizzes.

#### Scenario: Rematch single quiz with curriculum standards
- **GIVEN** An existing quiz without curriculum standard assignment
- **WHEN** POST /v1/curriculum-standards/match-quiz with quiz_id
- **THEN** analyze quiz content and suggest curriculum standards
- **AND** return match result without modifying quiz record
- **AND** teacher can review and manually assign if desired

#### Scenario: Batch rematch quizzes by subject
- **GIVEN** 100 quizzes for subject "物理" with no curriculum standards assigned
- **WHEN** POST /v1/curriculum-standards/batch-match-quizzes with subject filter
- **THEN** process all matching quizzes
- **AND** return summary with suggested curriculum standards for each quiz
- **AND** allow bulk assignment of confirmed matches
