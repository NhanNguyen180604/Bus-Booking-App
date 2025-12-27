import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "src/trpc/trpc.service";
import { BookingService } from "./booking.service";
import { BookingCancelDto, BookingCheckInDto, BookingCreateOneDto, BookingFindOneByIdDto, BookingLookUpDto, BookingUpdateDto, BookingUserSearchDto, GetBookingSeatsByTripDto, UserRoleEnum, BookingAdminSearchDto } from "@repo/shared";
import { User } from "src/entities/users.entity";
import { TRPCError } from "@trpc/server";

@Injectable()
export class BookingRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly bookingService: BookingService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/booking', 'BookingRouter');
        return this.trpcService.router({
            createOne: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.USER, UserRoleEnum.GUEST))
                .use(this.trpcService.accountVerifiedGuardMiddleware())
                .input(BookingCreateOneDto)
                .mutation(({ input, ctx }) => {
                    const { user } = ctx;
                    return this.bookingService.createOne(input, user);
                }),
            findOneById: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.USER, UserRoleEnum.ADMIN))
                .use(this.trpcService.accountVerifiedGuardMiddleware())
                .input(BookingFindOneByIdDto)
                .query(async ({ input, ctx }) => {
                    const user = ctx.user!;
                    const booking = await this.bookingService.findOneById(input.id);
                    if (!booking.payment.user) {
                        throw new TRPCError({
                            code: "INTERNAL_SERVER_ERROR",
                            message: "Could not find owner of the ticket",
                        });
                    }
                    if (booking.payment.user.id !== user.id && user.role !== UserRoleEnum.ADMIN) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: "You are not allowed to view other user's ticket",
                        });
                    }

                    booking.payment.user = {
                        ...user,
                        password: '',
                        providerId: '',
                        email: '',
                        name: '',
                        phone: '',
                    };
                    return booking;
                }),
            lookUpBooking: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.USER, UserRoleEnum.GUEST))
                .input(BookingLookUpDto)
                .query(({ input }) => {
                    return this.bookingService.lookUpOneBooking(input);
                }),
            userSearchBookings: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware())
                .use(this.trpcService.accountVerifiedGuardMiddleware())
                .input(BookingUserSearchDto)
                .query(({ input, ctx }) => {
                    const { user } = ctx;
                    return this.bookingService.userSearchBookings(input, user!);
                }),
            userCancelBooking: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.USER, UserRoleEnum.ADMIN))
                .use(this.trpcService.accountVerifiedGuardMiddleware())
                .input(BookingCancelDto)
                .mutation(({ input, ctx }) => {
                    const { user } = ctx;
                    return this.bookingService.userCancelBooking(input, user!);
                }),
            updateBooking: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.USER, UserRoleEnum.ADMIN))
                .use(this.trpcService.accountVerifiedGuardMiddleware())
                .input(BookingUpdateDto)
                .mutation(({ input, ctx }) => {
                    const { user } = ctx;
                    return this.bookingService.updateBooking(input, user);
                }),
            getBookingSeatsByTrip: this.trpcService
                .publicProcedure()
                .input(GetBookingSeatsByTripDto)
                .query(({ input }) => {
                    return this.bookingService.getBookingSeatsByTrip(input);
                }),
            checkInBooking: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN, UserRoleEnum.DRIVER))
                .input(BookingCheckInDto)
                .mutation(({ input, ctx }) => {
                    const user = ctx.user!;
                    return this.bookingService.checkInBooking(input, user);
                }),
            adminSearchBookings: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .input(BookingAdminSearchDto)
                .query(({ input }) => {
                    return this.bookingService.adminSearchBookings(input);
                })
        });
    }
}