# Enrollments System

This document describes the enrollment system for BHFE, including the database schema, API endpoints, and development workflow.

## Database Schema

The enrollment system uses the following database tables:

- `user_enrollments`: Stores enrollment records linking users to courses
- `users`: Stores user information
- `courses`: Stores course information

The relationship between these tables is as follows:

- `user_enrollments.user_id` → `users.id`
- `user_enrollments.course_id` → `courses.id`

### Migration Scripts

Several migration scripts have been created to set up and fix the enrollment system:

1. `03_enrollments.sql`: Initial enrollment table creation
2. `04_fix_enrollment_relations.sql`: Fixes the relationship between `user_enrollments` and `users` tables
3. `04_create_exec_sql_function.sql`: Creates a utility function for executing SQL

To apply migrations, use:

```
npm run db:migrate src/db/migrations/MIGRATION_FILE.sql
```

## API Endpoints

### User Enrollments

#### GET `/api/user/enrollments`

Returns all courses a user is enrolled in.

- **Authentication**: Required (or admin token in development)
- **Response**: JSON object with `enrollments` array
- **Example Response**:
  ```json
  {
    "enrollments": [
      {
        "id": "enrollment-id",
        "user_id": "user-id",
        "course_id": "course-id",
        "progress": 0,
        "completed": false,
        "enrolled_at": "2025-04-16T14:06:57.43+00:00",
        "course": {
          "id": "course-id",
          "title": "Course Title",
          "description": "Course Description",
          "main_subject": "Subject",
          "author": "Author Name",
          "table_of_contents_url": null,
          "course_content_url": null
        }
      }
    ]
  }
  ```

#### POST `/api/user/enrollments`

Enrolls a user in a course.

- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "courseId": "course-id"
  }
  ```
- **Response**: JSON object with `enrollmentId`
- **Example Response**:
  ```json
  {
    "enrollmentId": "new-enrollment-id"
  }
  ```

### Manual Enrollments (Admin)

#### POST `/api/enrollments/manual`

Creates a manual enrollment for a user.

- **Authentication**: Admin only
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "courseId": "course-id",
    "notes": "Optional enrollment notes"
  }
  ```
- **Response**: JSON object with enrollment details
- **Example Response**:
  ```json
  {
    "success": true,
    "enrollmentId": "new-enrollment-id",
    "userId": "user-id",
    "isNewUser": false
  }
  ```

## Development Workflow

### Using Admin Token

In development mode, you can use an admin token to bypass authentication:

1. Set a cookie `admin_token=temporary-token`
2. Visit `/my-courses` or make API requests to `/api/user/enrollments`

The system will automatically use a test user (email: `a.freed@outlook.com`) and provide real enrollments from the database.

You can test this with:

```
npm run test:my-courses
```

### Creating Test Enrollments

To create test enrollments:

1. Use the manual enrollment API:
   ```
   curl -X POST http://localhost:3000/api/enrollments/manual \
     -H "Content-Type: application/json" \
     -d '{"email": "a.freed@outlook.com", "courseId": "COURSE_ID"}'
   ```

2. Or use the user enrollments API with an authenticated user:
   ```
   curl -X POST http://localhost:3000/api/user/enrollments \
     -H "Content-Type: application/json" \
     -d '{"courseId": "COURSE_ID"}'
   ```

## Troubleshooting

### Empty Enrollments

If enrollments appear empty:

1. Check that the user has enrollments in the database
2. Verify the database relationship between `user_enrollments` and `users`
3. Ensure the API is properly joining the tables

### Authentication Issues

If you experience authentication issues:

1. In development, set the `admin_token=temporary-token` cookie
2. Check the browser console for authentication errors
3. Verify that the authService.ts is correctly handling the admin token

## Future Improvements

1. Add pagination to the enrollments API for large numbers of enrollments
2. Implement filtering and sorting options
3. Add enrollment analytics and progress tracking
4. Create a dedicated enrollments management interface for admins 