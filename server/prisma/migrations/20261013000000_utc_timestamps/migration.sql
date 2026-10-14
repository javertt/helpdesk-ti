-- Existing timestamps were written from JavaScript Date values in UTC.
-- Make the timezone explicit so PostgreSQL preserves the instant independently
-- of the database session timezone.
ALTER TABLE "User" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Ticket" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Ticket" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "Ticket" ALTER COLUMN "resolvedAt" TYPE TIMESTAMPTZ(3) USING "resolvedAt" AT TIME ZONE 'UTC';
ALTER TABLE "TicketMessage" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "TicketHistory" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
