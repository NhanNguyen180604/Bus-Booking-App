import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { User } from '../entities/users.entity';
import { Station } from '../entities/station.entity';
import { Route } from '../entities/route.entity';
import { BusType } from '../entities/bus-type.entity';
import { Bus } from '../entities/bus.entity';
import { Seat } from '../entities/seat.entity';
import { Trip } from '../entities/trip.entity';
import { Booking } from '../entities/booking.entity';
import { Payment } from '../entities/payment.entity';
import { Review } from '../entities/review.entity';
import { Notification, NotificationTypeEnum } from '../entities/notification.entity';
import { LoginProviderEnum } from '../entities/users.entity';
import { BusStatusEnum, SeatTypeEnum, TripStatusEnum, UserRoleEnum, PaymentProviderEnum, PaymentStatusEnum } from '@repo/shared';
import bcryptjs from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async seedAll() {
        this.logger.log('🌱 Starting database seeding...');

        try {
            // Check if data already exists
            const userCount = await this.entityManager.count(User);
            if (userCount > 0) {
                this.logger.warn('⚠️  Database already contains data. Skipping seeding.');
                this.logger.warn('⚠️  To force re-seed, clear the database first or use the --force flag.');
                return;
            }

            // Seed in order of dependencies
            const users = await this.seedUsers();
            const stations = await this.seedStations();
            const routes = await this.seedRoutes(stations);
            const busTypes = await this.seedBusTypes();
            const buses = await this.seedBuses(users, busTypes);
            await this.seedSeats(buses);
            const trips = await this.seedTrips(routes, buses);
            const bookings = await this.seedBookings(users, trips);
            await this.seedPayments(bookings);
            await this.seedReviews(users, trips, bookings);
            await this.seedNotifications(bookings);

            this.logger.log('✅ Database seeding completed successfully!');
        } catch (error) {
            this.logger.error('❌ Database seeding failed:', error);
            throw error;
        }
    }

    async forceSeedAll() {
        this.logger.log('🌱 Starting FORCE database seeding...');
        this.logger.warn('⚠️  This will clear all existing data!');

        try {
            await this.clearDatabase();
            
            // Seed in order of dependencies
            const users = await this.seedUsers();
            const stations = await this.seedStations();
            const routes = await this.seedRoutes(stations);
            const busTypes = await this.seedBusTypes();
            const buses = await this.seedBuses(users, busTypes);
            await this.seedSeats(buses);
            const trips = await this.seedTrips(routes, buses);
            const bookings = await this.seedBookings(users, trips);
            await this.seedPayments(bookings);
            await this.seedReviews(users, trips, bookings);
            await this.seedNotifications(bookings);

            this.logger.log('✅ Database force seeding completed successfully!');
        } catch (error) {
            this.logger.error('❌ Database seeding failed:', error);
            throw error;
        }
    }

    async clearDatabase() {
        this.logger.log('🗑️  Clearing database...');

        try {
            // Use TRUNCATE with CASCADE to properly clear all data and reset sequences
            // This will handle all foreign key constraints automatically
            await this.entityManager.query(`
                TRUNCATE TABLE 
                    "payment",
                    "booking",
                    "review",
                    "notification",
                    "trip",
                    "seat",
                    "bus",
                    "route",
                    "bus_type",
                    "station",
                    "reset_password_token",
                    "refresh_token",
                    "user"
                RESTART IDENTITY CASCADE
            `);

            this.logger.log('✓ Database cleared successfully');
        } catch (error) {
            this.logger.error('Failed to clear database:', error);
            throw error;
        }
    }

    private async seedUsers(): Promise<User[]> {
        this.logger.log('Seeding users...');

        const salt = await bcryptjs.genSalt();
        const hashedPassword = await bcryptjs.hash('Password123!', salt);

        const users: Partial<User>[] = [
            {
                email: 'admin@busapp.com',
                phone: '+1234567890',
                password: hashedPassword,
                provider: [LoginProviderEnum.LOCAL],
                providerId: null,
                name: 'Admin User',
                role: UserRoleEnum.ADMIN,
                verified: true,
                avatarUrl: null,
                avatarPublicID: null,
            },
            {
                email: 'driver1@busapp.com',
                phone: '+1234567891',
                password: hashedPassword,
                provider: [LoginProviderEnum.LOCAL],
                providerId: null,
                name: 'John Driver',
                role: UserRoleEnum.DRIVER,
                verified: true,
                avatarUrl: null,
                avatarPublicID: null,
            },
            {
                email: 'driver2@busapp.com',
                phone: '+1234567892',
                password: hashedPassword,
                provider: [LoginProviderEnum.LOCAL],
                providerId: null,
                name: 'Sarah Driver',
                role: UserRoleEnum.DRIVER,
                verified: true,
                avatarUrl: null,
                avatarPublicID: null,
            },
            {
                email: 'driver3@busapp.com',
                phone: '+1234567893',
                password: hashedPassword,
                provider: [LoginProviderEnum.LOCAL],
                providerId: null,
                name: 'Michael Driver',
                role: UserRoleEnum.DRIVER,
                verified: true,
                avatarUrl: null,
                avatarPublicID: null,
            },
            {
                email: 'user@busapp.com',
                phone: '+1234567894',
                password: hashedPassword,
                provider: [LoginProviderEnum.LOCAL],
                providerId: null,
                name: 'Regular User',
                role: UserRoleEnum.USER,
                verified: true,
                avatarUrl: null,
                avatarPublicID: null,
            },
            {
                email: 'user2@busapp.com',
                phone: '+1234567895',
                password: hashedPassword,
                provider: [LoginProviderEnum.LOCAL],
                providerId: null,
                name: 'Jane Smith',
                role: UserRoleEnum.USER,
                verified: true,
                avatarUrl: null,
                avatarPublicID: null,
            },
        ];

        const savedUsers = await this.entityManager.save(User, users);
        this.logger.log(`✓ Created ${savedUsers.length} users`);
        return savedUsers;
    }

    private async seedStations(): Promise<Station[]> {
        this.logger.log('Seeding stations...');

        const stations = [
            { name: 'New York City Terminal' },
            { name: 'Boston South Station' },
            { name: 'Philadelphia Bus Terminal' },
            { name: 'Washington DC Union Station' },
            { name: 'Baltimore Transit Hub' },
            { name: 'Chicago Union Station' },
            { name: 'Los Angeles Bus Terminal' },
            { name: 'San Francisco Transit Center' },
            { name: 'Seattle Bus Station' },
            { name: 'Miami Central Station' },
            { name: 'Atlanta Bus Terminal' },
            { name: 'Dallas Transit Center' },
            { name: 'Houston Bus Station' },
            { name: 'Phoenix Transit Hub' },
            { name: 'Denver Bus Terminal' },
        ];

        const savedStations = await this.entityManager.save(Station, stations);
        this.logger.log(`✓ Created ${savedStations.length} stations`);
        return savedStations;
    }

    private async seedRoutes(stations: Station[]): Promise<Route[]> {
        this.logger.log('Seeding routes...');

        const routes = [
            // Northeast corridor
            { origin: stations[0], destination: stations[1], distanceKm: 350, estimatedMinutes: 240 }, // NYC to Boston
            { origin: stations[1], destination: stations[0], distanceKm: 350, estimatedMinutes: 240 }, // Boston to NYC
            { origin: stations[0], destination: stations[2], distanceKm: 150, estimatedMinutes: 120 }, // NYC to Philly
            { origin: stations[2], destination: stations[0], distanceKm: 150, estimatedMinutes: 120 }, // Philly to NYC
            { origin: stations[2], destination: stations[3], distanceKm: 225, estimatedMinutes: 180 }, // Philly to DC
            { origin: stations[3], destination: stations[2], distanceKm: 225, estimatedMinutes: 180 }, // DC to Philly
            { origin: stations[3], destination: stations[4], distanceKm: 65, estimatedMinutes: 60 }, // DC to Baltimore
            { origin: stations[4], destination: stations[3], distanceKm: 65, estimatedMinutes: 60 }, // Baltimore to DC

            // Cross-country routes
            { origin: stations[5], destination: stations[6], distanceKm: 3200, estimatedMinutes: 2400 }, // Chicago to LA
            { origin: stations[6], destination: stations[5], distanceKm: 3200, estimatedMinutes: 2400 }, // LA to Chicago
            { origin: stations[6], destination: stations[7], distanceKm: 615, estimatedMinutes: 480 }, // LA to SF
            { origin: stations[7], destination: stations[6], distanceKm: 615, estimatedMinutes: 480 }, // SF to LA
            { origin: stations[7], destination: stations[8], distanceKm: 1300, estimatedMinutes: 900 }, // SF to Seattle
            { origin: stations[8], destination: stations[7], distanceKm: 1300, estimatedMinutes: 900 }, // Seattle to SF

            // Southern routes
            { origin: stations[9], destination: stations[10], distanceKm: 1050, estimatedMinutes: 720 }, // Miami to Atlanta
            { origin: stations[10], destination: stations[9], distanceKm: 1050, estimatedMinutes: 720 }, // Atlanta to Miami
            { origin: stations[10], destination: stations[11], distanceKm: 1200, estimatedMinutes: 800 }, // Atlanta to Dallas
            { origin: stations[11], destination: stations[10], distanceKm: 1200, estimatedMinutes: 800 }, // Dallas to Atlanta
            { origin: stations[11], destination: stations[12], distanceKm: 385, estimatedMinutes: 240 }, // Dallas to Houston
            { origin: stations[12], destination: stations[11], distanceKm: 385, estimatedMinutes: 240 }, // Houston to Dallas

            // Mountain/Desert routes
            { origin: stations[13], destination: stations[14], distanceKm: 1125, estimatedMinutes: 780 }, // Phoenix to Denver
            { origin: stations[14], destination: stations[13], distanceKm: 1125, estimatedMinutes: 780 }, // Denver to Phoenix
        ];

        const savedRoutes = await this.entityManager.save(Route, routes);
        this.logger.log(`✓ Created ${savedRoutes.length} routes`);
        return savedRoutes;
    }

    private async seedBusTypes(): Promise<BusType[]> {
        this.logger.log('Seeding bus types...');

        const busTypes = [
            { name: 'Standard' },
            { name: 'Deluxe' },
            { name: 'Sleeper' },
            { name: 'Double Decker' },
            { name: 'Express' },
        ];

        const savedBusTypes = await this.entityManager.save(BusType, busTypes);
        this.logger.log(`✓ Created ${savedBusTypes.length} bus types`);
        return savedBusTypes;
    }

    private async seedBuses(users: User[], busTypes: BusType[]): Promise<Bus[]> {
        this.logger.log('Seeding buses...');

        const drivers = users.filter(u => u.role === UserRoleEnum.DRIVER);

        const buses = [
            {
                driver: drivers[0],
                plateNumber: 'BUS-001-NY',
                type: busTypes[0], // Standard
                rows: 10,
                cols: 4,
                floors: 1,
                status: BusStatusEnum.ACTIVE,
            },
            {
                driver: drivers[1],
                plateNumber: 'BUS-002-NY',
                type: busTypes[1], // Deluxe
                rows: 8,
                cols: 4,
                floors: 1,
                status: BusStatusEnum.ACTIVE,
            },
            {
                driver: drivers[2],
                plateNumber: 'BUS-003-CA',
                type: busTypes[2], // Sleeper
                rows: 6,
                cols: 2,
                floors: 1,
                status: BusStatusEnum.ACTIVE,
            },
            {
                driver: null,
                plateNumber: 'BUS-004-TX',
                type: busTypes[3], // Double Decker
                rows: 8,
                cols: 4,
                floors: 2,
                status: BusStatusEnum.ACTIVE,
            },
            {
                driver: null,
                plateNumber: 'BUS-005-IL',
                type: busTypes[4], // Express
                rows: 9,
                cols: 4,
                floors: 1,
                status: BusStatusEnum.ACTIVE,
            },
            {
                driver: null,
                plateNumber: 'BUS-006-FL',
                type: busTypes[0], // Standard
                rows: 10,
                cols: 4,
                floors: 1,
                status: BusStatusEnum.MAINTENANCE,
            },
        ];

        const savedBuses = await this.entityManager.save(Bus, buses);
        this.logger.log(`✓ Created ${savedBuses.length} buses`);
        return savedBuses;
    }

    private async seedSeats(buses: Bus[]): Promise<void> {
        this.logger.log('Seeding seats...');

        let totalSeats = 0;

        for (const bus of buses) {
            const seats: Partial<Seat>[] = [];

            // Add driver seat at position [0, 0, 0]
            seats.push({
                bus: bus,
                code: 'D1',
                row: 0,
                col: 0,
                floor: 0,
                isActive: true,
                seatType: SeatTypeEnum.DRIVER,
            });

            // Generate passenger seats
            for (let floor = 0; floor < bus.floors; floor++) {
                for (let row = 0; row < bus.rows; row++) {
                    for (let col = 0; col < bus.cols; col++) {
                        // Skip driver seat position
                        if (floor === 0 && row === 0 && col === 0) continue;

                        // Floor determines the letter: floor 0 = A, floor 1 = B, etc.
                        // Then number is based on row * cols + col
                        const seatNumber = (row * bus.cols) + col + 1;
                        const seatCode = `${String.fromCharCode(65 + floor)}${String(seatNumber).padStart(2, '0')}`;
                        
                        seats.push({
                            bus: bus,
                            code: seatCode,
                            row: row,
                            col: col,
                            floor: floor,
                            isActive: true,
                            seatType: SeatTypeEnum.PASSENGER,
                        });
                    }
                }
            }

            await this.entityManager.save(Seat, seats);
            totalSeats += seats.length;
        }

        this.logger.log(`✓ Created ${totalSeats} seats across all buses`);
    }

    private async seedTrips(routes: Route[], buses: Bus[]): Promise<Trip[]> {
        this.logger.log('Seeding trips...');

        const activeBuses = buses.filter(b => b.status === BusStatusEnum.ACTIVE);
        const trips: Partial<Trip>[] = [];

        const now = new Date();

        // Create trips for the next 7 days
        for (let day = 0; day < 7; day++) {
            const departureDate = new Date(now);
            departureDate.setDate(departureDate.getDate() + day);

            // Morning trips (6 AM - 10 AM)
            for (let i = 0; i < 3 && i < routes.length; i++) {
                const route = routes[i];
                const bus = activeBuses[i % activeBuses.length];
                const departureTime = new Date(departureDate);
                departureTime.setHours(6 + (i * 2), 0, 0, 0);
                const arrivalTime = new Date(departureTime);
                arrivalTime.setMinutes(arrivalTime.getMinutes() + route.estimatedMinutes);

                const basePrice = [100000, 150000, 200000, 250000, 300000][i % 5];

                trips.push({
                    route: route,
                    bus: bus,
                    departureTime: departureTime,
                    arrivalTime: arrivalTime,
                    basePrice: basePrice,
                    status: TripStatusEnum.UPCOMING,
                });
            }

            // Afternoon trips (12 PM - 4 PM)
            for (let i = 3; i < 6 && i < routes.length; i++) {
                const route = routes[i];
                const bus = activeBuses[i % activeBuses.length];
                const departureTime = new Date(departureDate);
                departureTime.setHours(12 + ((i - 3) * 2), 0, 0, 0);
                const arrivalTime = new Date(departureTime);
                arrivalTime.setMinutes(arrivalTime.getMinutes() + route.estimatedMinutes);

                const basePrice = [150000, 200000, 250000, 300000, 350000][i % 5];

                trips.push({
                    route: route,
                    bus: bus,
                    departureTime: departureTime,
                    arrivalTime: arrivalTime,
                    basePrice: basePrice,
                    status: TripStatusEnum.UPCOMING,
                });
            }

            // Evening trips (6 PM - 10 PM)
            for (let i = 6; i < 9 && i < routes.length; i++) {
                const route = routes[i];
                const bus = activeBuses[i % activeBuses.length];
                const departureTime = new Date(departureDate);
                departureTime.setHours(18 + ((i - 6) * 2), 0, 0, 0);
                const arrivalTime = new Date(departureTime);
                arrivalTime.setMinutes(arrivalTime.getMinutes() + route.estimatedMinutes);

                const basePrice = [200000, 250000, 300000, 350000, 400000][i % 5];

                trips.push({
                    route: route,
                    bus: bus,
                    departureTime: departureTime,
                    arrivalTime: arrivalTime,
                    basePrice: basePrice,
                    status: TripStatusEnum.UPCOMING,
                });
            }
        }

        // Add some past trips
        for (let day = 1; day <= 3; day++) {
            const pastDate = new Date(now);
            pastDate.setDate(pastDate.getDate() - day);

            for (let i = 0; i < 2 && i < routes.length; i++) {
                const route = routes[i];
                const bus = activeBuses[i % activeBuses.length];
                const departureTime = new Date(pastDate);
                departureTime.setHours(10 + (i * 3), 0, 0, 0);
                const arrivalTime = new Date(departureTime);
                arrivalTime.setMinutes(arrivalTime.getMinutes() + route.estimatedMinutes);

                const basePrice = [120000, 180000, 240000, 300000][i % 4];

                trips.push({
                    route: route,
                    bus: bus,
                    departureTime: departureTime,
                    arrivalTime: arrivalTime,
                    basePrice: basePrice,
                    status: TripStatusEnum.ARRIVED,
                });
            }
        }

        const savedTrips = await this.entityManager.save(Trip, trips);
        this.logger.log(`✓ Created ${savedTrips.length} trips`);
        return savedTrips;
    }

    private async seedBookings(users: User[], trips: Trip[]): Promise<Booking[]> {
        this.logger.log('Seeding bookings...');

        const regularUsers = users.filter(u => u.role === UserRoleEnum.USER);
        const bookings: Partial<Booking>[] = [];

        // Get some past and upcoming trips
        const pastTrips = trips.filter(t => t.status === TripStatusEnum.ARRIVED);
        const upcomingTrips = trips.filter(t => t.status === TripStatusEnum.UPCOMING);

        // Create bookings for past trips (completed bookings)
        for (let i = 0; i < Math.min(5, pastTrips.length); i++) {
            const trip = pastTrips[i];
            const user = regularUsers[i % regularUsers.length];
            
            // Get some seats for this trip's bus
            const seats = await this.entityManager
                .createQueryBuilder(Seat, 'seat')
                .where('seat.bus = :busId', { busId: trip.bus.id })
                .andWhere('seat.seatType = :seatType', { seatType: SeatTypeEnum.PASSENGER })
                .take(2)
                .skip(i * 2)
                .getMany();

            if (seats.length === 0) continue;

            const totalPrice = seats.length * trip.basePrice;

            // Generate lookup code manually
            const tripPart = createHash("sha1")
                .update(trip.id)
                .digest("base64url")
                .slice(0, 4)
                .toUpperCase();
            const now = new Date();
            const yy = String(now.getFullYear()).slice(2);
            const MM = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            const datePart = `${yy}${MM}${dd}`;
            const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            const randomBytesBuf = randomBytes(4);
            let randomPart = "";
            for (let j = 0; j < 4; j++) {
                randomPart += alphabet[randomBytesBuf[j] % alphabet.length];
            }
            const lookupCode = `${tripPart}-${datePart}-${randomPart}`;

            const booking = this.entityManager.create(Booking, {
                lookupCode: lookupCode,
                trip: trip,
                seats: seats,
                fullName: user.name,
                phone: user.phone,
                email: user.email,
                totalPrice: totalPrice,
                token: randomBytes(32).toString('hex'),
                cancelToken: undefined,
                expiresAt: null, // null means payment successful
                checkedIn: true,
            });
            // Distribute booking creation dates over the past 30 days
            const daysAgo = Math.floor(Math.random() * 30) + 1;
            booking.createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            bookings.push(booking);
        }

        // Create bookings for upcoming trips (some paid, some pending)
        for (let i = 0; i < Math.min(8, upcomingTrips.length); i++) {
            const trip = upcomingTrips[i];
            const user = regularUsers[i % regularUsers.length];
            
            // Get some seats for this trip's bus
            const seats = await this.entityManager
                .createQueryBuilder(Seat, 'seat')
                .where('seat.bus = :busId', { busId: trip.bus.id })
                .andWhere('seat.seatType = :seatType', { seatType: SeatTypeEnum.PASSENGER })
                .take(Math.floor(Math.random() * 3) + 1) // 1-3 seats
                .skip(i * 3)
                .getMany();

            if (seats.length === 0) continue;

            const totalPrice = seats.length * trip.basePrice;
            const isPaid = i < 5; // First 5 are paid, rest are pending

            // Generate lookup code manually
            const tripPart = createHash("sha1")
                .update(trip.id)
                .digest("base64url")
                .slice(0, 4)
                .toUpperCase();
            const now = new Date();
            const yy = String(now.getFullYear()).slice(2);
            const MM = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            const datePart = `${yy}${MM}${dd}`;
            const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            const randomBytesBuf = randomBytes(4);
            let randomPart = "";
            for (let j = 0; j < 4; j++) {
                randomPart += alphabet[randomBytesBuf[j] % alphabet.length];
            }
            const lookupCode = `${tripPart}-${datePart}-${randomPart}`;

            const booking = this.entityManager.create(Booking, {
                lookupCode: lookupCode,
                trip: trip,
                seats: seats,
                fullName: user.name,
                phone: user.phone,
                email: user.email,
                totalPrice: totalPrice,
                token: randomBytes(32).toString('hex'),
                cancelToken: undefined,
                expiresAt: isPaid ? null : new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now if pending
                checkedIn: false,
            });
            // Distribute booking creation dates
            if (isPaid) {
                // Paid bookings created 1-15 days ago
                const daysAgo = Math.floor(Math.random() * 15) + 1;
                booking.createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            } else {
                // Pending bookings created in the last 2 days
                const daysAgo = Math.random() * 2;
                booking.createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            }
            bookings.push(booking);
        }

        const savedBookings = await this.entityManager.save(Booking, bookings);
        this.logger.log(`✓ Created ${savedBookings.length} bookings`);
        return savedBookings;
    }

    private async seedPayments(bookings: Booking[]): Promise<void> {
        this.logger.log('Seeding payments...');

        const payments: Partial<Payment>[] = [];

        for (let idx = 0; idx < bookings.length; idx++) {
            const booking = bookings[idx];
            // Only create payment if booking is paid (expiresAt is null)
            if (booking.expiresAt === null) {
                const payment = this.entityManager.create(Payment, {
                    status: PaymentStatusEnum.COMPLETED,
                    user: undefined, // Can be null for guest bookings
                    booking: booking,
                    paymentProvider: Math.random() > 0.5 ? PaymentProviderEnum.STRIPE : PaymentProviderEnum.BANK,
                    paymentTransactionId: `txn_${randomBytes(16).toString('hex')}`,
                    amount: booking.totalPrice,
                    cancellationReason: undefined,
                });
                // Distribute payment creation dates over the past month
                const daysAgo = Math.floor(Math.random() * 30);
                payment.createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
                payments.push(payment);
            } else {
                // Pending payment
                const payment = this.entityManager.create(Payment, {
                    status: PaymentStatusEnum.PROCESSING,
                    user: undefined,
                    booking: booking,
                    paymentProvider: PaymentProviderEnum.STRIPE,
                    paymentTransactionId: undefined,
                    amount: booking.totalPrice,
                    cancellationReason: undefined,
                });
                // Recent pending payments (last 3 days)
                const daysAgo = Math.floor(Math.random() * 3);
                payment.createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
                payments.push(payment);
            }
        }

        await this.entityManager.save(Payment, payments);
        this.logger.log(`✓ Created ${payments.length} payments`);
    }

    private async seedReviews(users: User[], trips: Trip[], bookings: Booking[]): Promise<void> {
        this.logger.log('Seeding reviews...');

        const regularUsers = users.filter(u => u.role === UserRoleEnum.USER);
        const completedBookings = bookings.filter(b => b.expiresAt === null && b.checkedIn);
        const reviews: Partial<Review>[] = [];

        // Create reviews for some completed bookings
        for (let i = 0; i < Math.min(3, completedBookings.length); i++) {
            const booking = completedBookings[i];
            const user = regularUsers[i % regularUsers.length];

            const reviewComments = [
                'Great experience! The bus was clean and comfortable.',
                'Driver was very professional and the journey was smooth.',
                'Good service overall. Would recommend to others.',
                'Pleasant trip. The seats were comfortable and spacious.',
                'Excellent service. Everything was on time and well organized.',
            ];

            reviews.push({
                trip: booking.trip,
                user: user,
                booking: booking,
                rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
                comment: reviewComments[i % reviewComments.length],
            });
        }

        await this.entityManager.save(Review, reviews);
        this.logger.log(`✓ Created ${reviews.length} reviews`);
    }

    private async seedNotifications(bookings: Booking[]): Promise<void> {
        this.logger.log('Seeding notifications...');

        const notifications: Partial<Notification>[] = [];

        for (const booking of bookings) {
            // Add reminder notification for upcoming trips
            if (booking.expiresAt === null && !booking.checkedIn) {
                notifications.push({
                    booking: booking,
                    message: `Your trip is coming up soon! Don't forget to check in.`,
                    type: NotificationTypeEnum.UPCOMING_TRIP_REMINDER,
                });
            }

            // Add thank you notification for completed trips
            if (booking.checkedIn) {
                notifications.push({
                    booking: booking,
                    message: `Thank you for traveling with us! We hope you had a great journey.`,
                    type: NotificationTypeEnum.POST_TRIP_THANK_YOU,
                });
            }
        }

        await this.entityManager.save(Notification, notifications);
        this.logger.log(`✓ Created ${notifications.length} notifications`);
    }
}
