# Bulk User Registration Templates

This directory contains template files for bulk user registration.

## Template Files

### CSV Format (`bulk-users-template.csv`)
- Use this format for spreadsheet applications like Excel
- Fields: account, password, name, role, class
- Leave class empty for teachers and admins

### JSON Format (`bulk-users-template.json`)
- Use this format for API requests
- Set class to `null` for teachers and admins

## Field Descriptions

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| account | Yes | Unique account ID (email or username) | student001 |
| password | Yes | User password (min 6 characters) | password123 |
| name | Yes | Display name | 张三 |
| role | Yes | User role: student, teacher, or admin | student |
| class | Conditional | Class identifier (required for students, null for others) | 20250101 |

## Class Format

The class field should follow the pattern: `YYYYMMDD` where:
- YYYY: Year (e.g., 2025)
- MM: Month (e.g., 01 for January)
- DD: Class number (e.g., 01 for Class 1)

Examples:
- `20250101` - 2025年1月1班
- `20250102` - 2025年1月2班
- `20250201` - 2025年2月1班

## Usage

### Via Admin API

```bash
# Using JSON format
curl -X POST http://localhost:8718/v1/admin/users/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @bulk-users-template.json
```

### Via Admin Interface

1. Log in as an admin user
2. Navigate to User Management
3. Click "Bulk Import"
4. Upload the CSV or paste the JSON data
5. Review and confirm the import

## Important Notes

- **Students MUST have a class assigned**
- Teachers and admins should have class set to null or empty
- Account IDs must be unique across the system
- Passwords must be at least 6 characters long
- The system will reject any users that already exist