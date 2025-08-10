# Quiz Parser Design

## Overview
Adds the `@kedge/quiz-parser` library to turn highlighted DOCX content into structured quiz items using OpenAI.

## Components
- **DocxService** – parses uploaded DOCX buffers and returns paragraphs along with highlighted segments.
- **GptService** – generates quiz items, polishes wording, or converts item types through OpenAI responses.
- **QuizParserModule** – exports the services for use in other modules.

## API Integration
- `POST /docx/extract-quiz` uploads a DOCX file and returns generated quiz items.
- `POST /gpt/extract-quiz` accepts parsed paragraphs and generates quiz items.
- `POST /gpt/polish-quiz` tweaks question phrasing while keeping answers the same.
- `POST /gpt/change-quiz-type` converts an item to a new question type.

## Future Work
- Validate DOCX structure before parsing.
- Expand GPT prompts for additional question formats.
