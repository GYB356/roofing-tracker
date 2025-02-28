# Database Migrations

This directory contains the database migration files for our healthcare management system.

## How to Handle Schema Changes

When you need to make changes to the database schema:

1. First, update the models in `shared/schema.ts`
2. Run `npx drizzle-kit generate:pg` to generate new migration files
3. The migrations will be automatically applied when the server starts

## Important Notes

- Never modify existing migration files
- Always test migrations on a development database first
- If you encounter migration errors, check the server logs for details
- The `meta` directory contains Drizzle's internal migration tracking

## Common Commands

```bash
# Generate new migration files
npx drizzle-kit generate:pg

# Check migration status
npx drizzle-kit check:pg

# Push schema changes directly (development only)
npx drizzle-kit push:pg
```
