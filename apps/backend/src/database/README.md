# Database Seeding

This directory contains the database seeding functionality for the Bus Booking Application.

## Files

- **`seed.service.ts`** - Main service that contains all seeding logic
- **`seed.ts`** - Standalone script to run the seeding
- **`database-init.service.ts`** - Database initialization (pg_trgm extension setup)

## Running the Seed

To seed the database with initial data:

```bash
cd apps/backend
pnpm seed
```

Or from the root:

```bash
pnpm --filter backend seed
```

### Force Re-seeding

If you want to clear the database and re-seed (⚠️ **WARNING: This will delete all existing data!**):

```bash
cd apps/backend
pnpm seed:force
```

Or from the root:

```bash
pnpm --filter backend seed:force
```

## What Gets Seeded

### 1. Users (6 users)
- **Admin**: `admin@busapp.com` / `Password123!`
- **Drivers (3)**: 
  - `driver1@busapp.com` / `Password123!` (John Driver)
  - `driver2@busapp.com` / `Password123!` (Sarah Driver)
  - `driver3@busapp.com` / `Password123!` (Michael Driver)
- **Regular Users (2)**:
  - `user@busapp.com` / `Password123!` (Regular User)
  - `user2@busapp.com` / `Password123!` (Jane Smith)

### 2. Stations (15 stations)
Major city bus terminals including:
- New York City Terminal
- Boston South Station
- Philadelphia Bus Terminal
- Washington DC Union Station
- Baltimore Transit Hub
- Chicago Union Station
- Los Angeles Bus Terminal
- San Francisco Transit Center
- Seattle Bus Station
- Miami Central Station
- Atlanta Bus Terminal
- Dallas Transit Center
- Houston Bus Station
- Phoenix Transit Hub
- Denver Bus Terminal

### 3. Routes (22 routes)
Bidirectional routes connecting major cities:
- Northeast corridor (NYC, Boston, Philly, DC, Baltimore)
- Cross-country routes (Chicago to LA, LA to SF, SF to Seattle)
- Southern routes (Miami, Atlanta, Dallas, Houston)
- Mountain/Desert routes (Phoenix, Denver)

### 4. Bus Types (5 types)
- Standard
- Deluxe
- Sleeper
- Double Decker
- Express

### 5. Buses (6 buses)
- 3 buses with assigned drivers (ACTIVE)
- 2 buses without drivers (ACTIVE)
- 1 bus in MAINTENANCE status

Each bus has realistic seat layouts:
- Standard buses: 10 rows × 4 cols × 1 floor (40 seats + driver)
- Deluxe buses: 8 rows × 4 cols × 1 floor (32 seats + driver)
- Sleeper buses: 6 rows × 2 cols × 1 floor (12 seats + driver)
- Double Decker: 8 rows × 4 cols × 2 floors (64 seats + driver)
- Express buses: 9 rows × 4 cols × 1 floor (36 seats + driver)

### 6. Seats
Automatically generated for all buses based on their layout configuration:
- One driver seat per bus (position [0,0,0], code "D1")
- Passenger seats with codes like "A1", "B2", "C3-F2" (for floor 2)

### 7. Trips
Multiple trips created for the next 7 days:
- Morning trips (6 AM - 10 AM)
- Afternoon trips (12 PM - 4 PM)
- Evening trips (6 PM - 10 PM)
- Plus some past completed trips

Prices are calculated based on distance: `basePrice = 25-35 + (distanceKm * 0.05)`

## Important Notes

- **Idempotent**: The seed will check if data already exists and skip seeding if any users are found
- **Dependencies**: Seeding happens in order of entity dependencies (Users → Stations → Routes → BusTypes → Buses → Seats → Trips)
- **Password**: All users use the same password for development: `Password123!`
- **Clean Database**: For best results, start with an empty database

## Clearing the Database

If you need to re-seed, you can either:

1. Drop and recreate the database manually
2. Delete all records from tables in reverse dependency order
3. Use a database management tool to truncate all tables

## Development Tips

- After seeding, you can login with any of the seeded user credentials
- The admin account has full access to all features
- Driver accounts can be used to test driver-specific features
- Regular user accounts can be used to test booking flows
