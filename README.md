# Conexa Backend

Express.js REST API for the CONEXA platform - a logistics solution connecting transporters and companies.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5
- **Database**: PostgreSQL with `pg` driver
- **Authentication**: JWT with HTTP-only cookies + Bearer token support
- **Validation**: Zod v4
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file in the root:

```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/conexa
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### Development

```bash
pnpm dev
```

Server runs on `http://localhost:4000`

### Production

```bash
pnpm start
```

## API Endpoints

### Auth

| Method | Endpoint     | Description        |
|--------|--------------|--------------------|
| POST   | /api/auth/register | Register new user |
| POST   | /api/auth/login    | User login        |

### Profile

| Method | Endpoint         | Description          |
|--------|------------------|----------------------|
| POST   | /api/profile/setup | Setup user profile  |
| GET    | /api/profile/me   | Get user profile     |

## User Roles

- `transporter` - Transport company/owner
- `company` - Business needing freight services

## Architecture

```
Routes → Controller → Service → Database
```

- **Routes**: Express Router with middleware
- **Controller**: Request/response handling
- **Service**: Business logic
- **Database**: Raw SQL queries with pg

## Project Structure

```
src/
├── app.js
├── config/db.js
├── modules/
│   ├── auth/
│   └── profile/
└── shared/
    ├── middlewares/
    └── utils/
```
