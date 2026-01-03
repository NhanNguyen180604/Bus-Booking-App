# Database Seeding Quick Start Guide

This guide will help you quickly seed your Bus Booking App database with sample data.

## Prerequisites

1. Make sure your database is running and accessible
2. Ensure your `.env` file is configured with the correct database connection
3. Run `pnpm install` to install all dependencies

## Quick Start

### Option 1: Seed from backend directory

```bash
cd apps/backend
pnpm seed
```

### Option 2: Seed from root directory

```bash
pnpm --filter backend seed
```

## What Gets Seeded?

The seeding process will populate your database with:

- ✅ **6 Users** (1 admin, 3 drivers, 2 regular users)
- ✅ **15 Bus Stations** across major US cities
- ✅ **22 Routes** (bidirectional routes connecting cities)
- ✅ **5 Bus Types** (Standard, Deluxe, Sleeper, Double Decker, Express)
- ✅ **6 Buses** with realistic seat layouts
- ✅ **200+ Seats** (automatically generated based on bus configurations)
- ✅ **100+ Trips** (for the next 7 days + some past trips)

## Test Credentials

After seeding, you can log in with these accounts:

| Role | Email | Password | Name |
|------|-------|----------|------|
| Admin | admin@busapp.com | Password123! | Admin User |
| Driver | driver1@busapp.com | Password123! | John Driver |
| Driver | driver2@busapp.com | Password123! | Sarah Driver |
| Driver | driver3@busapp.com | Password123! | Michael Driver |
| User | user@busapp.com | Password123! | Regular User |
| User | user2@busapp.com | Password123! | Jane Smith |

## Re-seeding (Clear & Seed)

⚠️ **WARNING: This will DELETE ALL existing data!**

```bash
# From backend directory
cd apps/backend
pnpm seed:force

# Or from root
pnpm --filter backend seed:force
```

## Seeded Data Details

### Stations
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

### Routes
Popular routes include:
- NYC ↔ Boston (350 km, ~4 hours)
- NYC ↔ Philadelphia (150 km, ~2 hours)
- Philadelphia ↔ Washington DC (225 km, ~3 hours)
- Chicago ↔ Los Angeles (3200 km, ~40 hours)
- San Francisco ↔ Seattle (1300 km, ~15 hours)
- And many more!

### Buses

| Plate Number | Type | Layout | Driver | Status |
|--------------|------|--------|--------|--------|
| BUS-001-NY | Standard | 10×4×1 | John Driver | Active |
| BUS-002-NY | Deluxe | 8×4×1 | Sarah Driver | Active |
| BUS-003-CA | Sleeper | 6×2×1 | Michael Driver | Active |
| BUS-004-TX | Double Decker | 8×4×2 | Unassigned | Active |
| BUS-005-IL | Express | 9×4×1 | Unassigned | Active |
| BUS-006-FL | Standard | 10×4×1 | Unassigned | Maintenance |

### Trips
Trips are scheduled throughout the day:
- **Morning**: 6 AM - 10 AM
- **Afternoon**: 12 PM - 4 PM
- **Evening**: 6 PM - 10 PM

Prices are calculated as: `basePrice + (distance × $0.05/km)`

## Troubleshooting

### Error: Database already contains data

If you see this message, it means the database already has users. To re-seed:
1. Use `pnpm seed:force` to clear and re-seed
2. Or manually clear the database first

### Connection Error

Make sure your `.env` file has the correct database URL:
```env
DATABASE__URL=postgresql://username:password@localhost:5432/bus_booking_db
```

### Missing Dependencies

Run `pnpm install` from the root directory to install all required packages.

## Next Steps

After seeding:
1. Start the backend server: `pnpm --filter backend dev`
2. Start the frontend: `pnpm --filter frontend dev`
3. Log in with any of the test accounts
4. Explore the application with realistic data!

## More Information

For detailed information about the seeding implementation, see:
- [apps/backend/src/database/README.md](apps/backend/src/database/README.md)
- [apps/backend/src/database/seed.service.ts](apps/backend/src/database/seed.service.ts)
