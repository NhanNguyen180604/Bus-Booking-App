import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "src/trpc/trpc.service";
import { BookingService } from "./booking.service";
import {
    BookingCancelDto,
    BookingCreateOneDto,
    BookingLookUpDto,
    BookingUserSearchDto,
    GetBookingSeatsByTripDto,
} from "@repo/shared";
import { UserRoleEnum } from "src/entities/users.entity";

@Injectable()
export class BookingRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly bookingService: BookingService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/booking', 'BookingRouter');
        return this.trpcService.router({
            createOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.USER, UserRoleEnum.GUEST)
                .input(BookingCreateOneDto)
                .mutation(({ input, ctx }) => {
                    const { user } = ctx;
                    return this.bookingService.createOne(input, user);
                }),
            lookUpBooking: this.trpcService
                .roleGuardProcedure(UserRoleEnum.USER, UserRoleEnum.GUEST)
                .input(BookingLookUpDto)
                .query(({ input }) => {
                    return this.bookingService.lookUpOneBooking(input);
                }),
            userSearchBookings: this.trpcService
                .roleGuardProcedure()
                .input(BookingUserSearchDto)
                .query(({ input, ctx }) => {
                    const { user } = ctx;
                    return this.bookingService.userSearchBookings(input, user!);
                }),
            userCancelBooking: this.trpcService
                .roleGuardProcedure(UserRoleEnum.USER, UserRoleEnum.GUEST)
                .input(BookingCancelDto)
                .mutation(({ input, ctx }) => {
                    const { user } = ctx;
                    return this.bookingService.userCancelBooking(input, user);
                }),
            getBookingSeatsByTrip: this.trpcService
                .roleGuardProcedure(UserRoleEnum.USER, UserRoleEnum.GUEST)
                .input(GetBookingSeatsByTripDto)
                .query(({ input }) => {
                    return this.bookingService.getBookingSeatsByTrip(input);
                }),
        });
    }
}