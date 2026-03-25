# AGENTS.md - Conexa Backend

## Project Overview

Express.js REST API with PostgreSQL, JWT authentication, and Zod validation. Uses ES modules, pnpm, and follows a layered architecture (Controller → Service → Database).

---

## Commands

### Development
```bash
pnpm dev          # Start server with hot reload (node --watch)
pnpm start        # Start production server
```

### Testing
No test framework configured. To add tests:
```bash
pnpm add -D vitest    # Recommended for this project
pnpm vitest run       # Run all tests
pnpm vitest run --reporter=verbose src/modules/auth/auth.service.test.js  # Single test file
```

### Linting
No linter configured. To add:
```bash
pnpm add -D eslint @eslint/js eslint-plugin-n
pnpm eslint src/       # Lint all files
```

---

## Code Style Guidelines

### Project Structure
```
src/
├── app.js                    # Express app entry point
├── config/db.js              # Database configuration
├── modules/
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.routes.js
│   │   └── auth.schema.js    # Zod schemas (named exports)
│   └── profile/
│       ├── profile.controller.js
│       ├── profile.service.js
│       ├── profile.routes.js
│       └── profile.schema.js
└── shared/
    ├── middlewares/
    │   ├── auth.guard.js
    │   └── validate.js
    └── utils/
        └── jwt.js
```

### Imports
- Use ES modules with `.js` extension: `import X from './file.js'`
- Group imports: external libs → internal modules → relative utils
- Use absolute-like paths from `src/`: `import pool from '../../config/db.js'`

```javascript
import express from 'express'
import bcrypt from 'bcryptjs'
import AuthService from './auth.service.js'
import pool from '../../config/db.js'
```

### Naming Conventions
- **Files**: kebab-case (`auth.controller.js`, `auth-guard.js`)
- **Classes**: PascalCase (`AuthController`, `ProfileService`)
- **Functions/variables**: camelCase (`generateToken`, `userId`)
- **Database fields**: snake_case (`company_name`, `created_at`)
- **Constants**: UPPER_SNAKE_CASE

### Architecture Pattern

**Routes** → **Controller** → **Service** → **Database**

- **Routes**: Express Router, apply middleware, delegate to controller
- **Controller**: Handle HTTP request/response, call service, error handling
- **Service**: Business logic, database queries, return domain objects
- **Schema**: Zod validation schemas with named exports

```javascript
// routes
router.post('/register', validate(registerSchema), (req, res) => authController.register(req, res))

// controller
class AuthController {
  async register(req, res) {
    try {
      const user = await authService.register(req.body)
      // ... response
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
}

// service
class AuthService {
  constructor(db) { this.db = db }
  async register({ email, password, role, full_name, phone }) {
    // business logic
    return result.rows[0]
  }
}
```

### Error Handling
- Controllers: try-catch with `res.status(code).json({ message: err.message })`
- Services: throw `new Error('descriptive message')`
- Use appropriate HTTP status codes:
  - `201` - Created
  - `400` - Bad Request / Validation Error
  - `401` - Unauthorized
  - `404` - Not Found

### Validation with Zod
- Use Zod v4 (`import { z } from 'zod'`)
- Named exports for schemas: `export const registerSchema = z.object({...})`
- Schema validation via middleware:

```javascript
// middleware/validate.js
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues.map(...) })
  }
  req.body = result.data
  next()
}
```

### Authentication
- JWT tokens in HTTP-only cookies
- Also support Bearer token in Authorization header
- Auth guard middleware populates `req.user`

```javascript
// cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

### Database Queries
- Use parameterized queries (`$1`, `$2`) to prevent SQL injection
- Use `RETURNING *` for inserts
- Always destruct password out of user objects before sending to client

```javascript
const { password: _, ...userWithoutPassword } = user
return userWithoutPassword
```

### Response Format
```javascript
// Success
res.status(201).json({ user })
res.status(200).json(profile)

// Error
res.status(400).json({ message: 'Error description' })
res.status(400).json({ errors: [{ field: 'email', message: '...' }] })
```

### General Guidelines
- No TypeScript - plain JavaScript only
- No comments unless explaining complex business logic
- Use async/await for all async operations
- Controller methods must be `async`
- Services receive `db` (pool) via constructor dependency injection
- Export singleton instances for controllers: `export default new AuthController()`
