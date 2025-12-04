# BoxPack Security Migration - Setup Instructions

## Overview

All database operations have been successfully migrated from the frontend to a secure backend API. The application now uses JWT authentication and implements multiple security measures to protect against SQL injection and other attacks.

## Security Improvements

1. **JWT Authentication**: Token-based authentication with secure session management
2. **Backend API**: All database operations now go through protected backend endpoints
3. **Security Middleware**:
   - Helmet.js for security headers
   - CORS protection
   - Rate limiting (100 requests per 15 minutes for API, 5 for auth)
   - Input validation and sanitization
   - SQL injection protection

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd BoxPack/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   Create a `.env` file in the backend directory with the following content:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_SERVICE_KEY=your_supabase_service_key_here
   
   # JWT Configuration  
   JWT_SECRET=your_jwt_secret_here_change_this_in_production
   JWT_EXPIRES_IN=7d
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:5173
   ```

4. **Important**: Replace the placeholder values:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key (NOT the anon key)
   - `JWT_SECRET`: Generate a strong random secret (at least 32 characters)
     ```bash
     # Generate a secure secret:
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

5. **Start the backend server**:
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd BoxPack/frontend
   ```

2. **Create `.env` file**:
   Create a `.env` file in the frontend directory with:
   ```
   # Backend API Configuration
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Install dependencies** (if needed):
   ```bash
   npm install
   ```

4. **Start the frontend**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Get current user (requires token)

### Materials (Public read, Admin write)
- `GET /api/materials` - Get all materials
- `GET /api/materials/:id` - Get material by ID
- `GET /api/materials/:id/thicknesses` - Get thicknesses for material
- `POST /api/materials` - Create material (Admin)
- `PUT /api/materials/:id` - Update material (Admin)
- `DELETE /api/materials/:id` - Delete material (Admin)

### Options (Public read, Admin write)
- `GET /api/options` - Get all options
- `POST /api/options` - Create option (Admin)
- `PUT /api/options/:id` - Update option (Admin)
- `DELETE /api/options/:id` - Delete option (Admin)

### Orders (Authenticated users)
- `GET /api/orders/my-orders` - Get current user's orders
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Inventory (Admin only)
- `GET /api/inventory` - Get all inventory
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id/stock` - Update stock
- `PUT /api/inventory/:id/min-stock` - Update min stock level
- `GET /api/inventory/:id/history` - Get inventory history

### Profiles (Authenticated users)
- `GET /api/profiles/me` - Get current user profile
- `PUT /api/profiles/me` - Update current user profile

## Security Features

### JWT Authentication
- Tokens are stored in localStorage
- Tokens expire after 7 days (configurable)
- All protected endpoints require valid token

### Rate Limiting
- API endpoints: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP

### Input Validation
- All inputs are validated using express-validator
- SQL injection protection through parameterized queries
- XSS protection through input sanitization

### CORS Protection
- Only configured frontend URL can access the API
- Credentials are allowed for authenticated requests

### Security Headers
- Helmet.js adds security headers
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options

## Testing

1. **Test backend health**:
   ```bash
   curl http://localhost:3000/
   ```

2. **Test signup**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "full_name": "Test User"
     }'
   ```

3. **Test signin**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

## Deployment Considerations

### Production Environment Variables
- Set `NODE_ENV=production`
- Use a strong, unique `JWT_SECRET`
- Update `FRONTEND_URL` to your production domain
- Use HTTPS for both frontend and backend

### Backend Deployment
- Use a process manager like PM2
- Set up SSL/TLS certificates
- Configure firewall rules
- Enable logging and monitoring

### Security Best Practices
- Never commit `.env` files
- Rotate JWT secrets regularly
- Monitor rate limit violations
- Set up logging and alerting
- Regular security audits

## Troubleshooting

### Backend won't start
- Check that all environment variables are set
- Verify Supabase credentials
- Check port 3000 is available

### Frontend can't connect to backend
- Verify backend is running
- Check CORS configuration
- Ensure VITE_API_URL is correct

### Authentication issues
- Check JWT_SECRET is set correctly
- Verify token is being sent in Authorization header
- Check token hasn't expired

## Migration Notes

### What Changed
- Removed direct Supabase client usage from frontend
- All database operations now go through backend API
- Added JWT token-based authentication
- Implemented comprehensive security middleware
- Added input validation on all endpoints

### What Stayed the Same
- All UI components and pages
- User experience remains unchanged
- All features continue to work as before

## Support

If you encounter any issues:
1. Check the backend logs
2. Verify environment variables
3. Test API endpoints with curl
4. Check browser console for errors

