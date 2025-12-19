import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "src/trpc/trpc.service";
import { BookingService } from "./booking.service";
import { BookingCancelDto, BookingCreateOneDto, BookingFindOneByIdDto, BookingLookUpDto, BookingUpdateDto, BookingUserSearchDto, GetBookingSeatsByTripDto } from "@repo/shared";
import { User, UserRoleEnum } from "src/entities/users.entity";

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
                .query(({ input }) => {
                    // TODO: verify owner of booking here
                    return this.bookingService.findOneById(input.id);
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
                    return this.bookingService.userCancelBooking(input, user);
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
        });
    }
}