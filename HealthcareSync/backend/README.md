# Backend Development Guide

## Running Locally

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthcare
PORT=5000
NODE_ENV=development
```

3. Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:5000`.

## Replit Development

When developing on Replit:
1. All dependencies will be installed automatically
2. Environment variables must be set in Replit Secrets
3. The server must be run through Replit's workflow system

## Testing

To verify the server is running:
1. Visit the `/health` endpoint
2. Check the response includes:
   - `status: "ok"`
   - `database: "connected"`

## Common Issues

### Database Connection
If you see database connection errors:
1. Verify DATABASE_URL is set correctly
2. Ensure PostgreSQL is running
3. Check database permissions

### Server Not Starting
1. Verify PORT is available (default: 5000)
2. Check for conflicting processes
3. Review server logs for detailed error messages
