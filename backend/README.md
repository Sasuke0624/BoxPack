# BoxPack Backend API

Secure backend API for BoxPack application with JWT authentication and comprehensive security measures.

## Features

- JWT-based authentication
- Role-based access control (User/Admin)
- Rate limiting and security headers
- Input validation and sanitization
- SQL injection protection
- Comprehensive API endpoints for all database operations

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file (see `.env.example`)

3. Start server:
   ```bash
   npm run dev  # Development
   npm start    # Production
   ```

## Project Structure

```
backend/
├── config/
│   └── supabase.js          # Supabase admin client configuration
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── security.js          # Security middleware (helmet, rate limiting)
│   └── validation.js        # Input validation rules
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── materials.js         # Materials and thicknesses
│   ├── options.js           # Options management
│   ├── orders.js            # Order management
│   ├── profiles.js          # User profiles
│   ├── users.js             # User management (admin)
│   └── inventory.js         # Inventory management (admin)
├── index.js                 # Main application entry point
├── package.json
└── .env.example

```

## Environment Variables

Required environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRES_IN` - Token expiration time (e.g., "7d")
- `FRONTEND_URL` - Frontend URL for CORS

## Security

- **Helmet.js**: Security headers
- **CORS**: Configured for frontend origin only
- **Rate Limiting**: 100 req/15min for API, 5 req/15min for auth
- **JWT**: Secure token-based authentication
- **Input Validation**: Express-validator for all inputs
- **SQL Injection Protection**: Parameterized queries via Supabase

## API Documentation

See `SETUP_INSTRUCTIONS.md` in the root directory for complete API documentation.

