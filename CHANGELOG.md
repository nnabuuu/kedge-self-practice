# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-08-27

### Added
- Initial release of Kedge Self-Practice Learning Platform
- Core learning system with knowledge point management
- Multi-format quiz support (single choice, multiple choice, fill-in-the-blank, subjective)
- Practice session management with customizable configurations
- AI-powered intelligent answer validation for fill-in-the-blank questions
- Alternative answer support with learning capability
- Auto-advance feature with user preference persistence
- Role-based access control (Admin, Teacher, Student)
- Admin dashboard for user management
- User preferences with backend persistence
- JWT-based secure authentication
- Modern React frontend with TypeScript
- Knowledge Point Picker modal component
- Real-time answer validation with explanations
- NestJS backend architecture
- PostgreSQL database with Hasura GraphQL
- Comprehensive database migrations
- Deployment configurations for production

### Fixed
- User search functionality in admin dashboard
- SQL query building issues in admin controller
- Duplicate user creation error handling
- Quiz parser build errors
- FilteredUsers.map error in user management
- Authentication issues for admin users accessing teacher resources

### Security
- Implemented PBKDF2 password hashing
- Added JWT token management
- Protected admin-only endpoints
- Role-based access control enforcement

## [Unreleased]

### Planned
- Enhanced AI-powered quiz generation
- Advanced analytics and reporting dashboard
- Collaborative learning features
- Mobile application
- Expanded subject coverage
- Real-time collaboration tools
- Gamification elements
- Parent/guardian portal
- Export functionality for practice results
- Offline mode support

---

For detailed release notes, see [RELEASE_NOTES.md](RELEASE_NOTES.md) (English) or [RELEASE_NOTES_CN.md](RELEASE_NOTES_CN.md) (简体中文).