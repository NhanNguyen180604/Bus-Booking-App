import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "src/trpc/trpc.service";
import { BookingService } from "./booking.service";
import { BookingCancelDto, BookingConfirmDto, BookingCreateOneDto, BookingFindOneByIdDto, BookingLookUpDto, BookingUpdateDto, BookingUserSearchDto, GetBookingSeatsByTripDto } from "@repo/shared";
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
            createOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.USER, UserRoleEnum.GUEST)
                .input(BookingCreateOneDto)
                .mutation(({ input, ctx }) => {
                    const { user } = ctx;
                    return this.bookingService.createOne(input, user);
                }),
            confirmBooking: this.trpcService
                .roleGuardProcedure(UserRoleEnum.USER, UserRoleEnum.GUEST)
                .input(BookingConfirmDto)
                .mutation(({ input }) => {
                    return this.bookingService.confirmBooking(input);
                }),
            findOneById: this.trpcService
                .roleGuardProcedure(UserRoleEnum.USER, UserRoleEnum.GUEST)
                .input(BookingFindOneByIdDto)
                .query(({ input }) => {
                    return this.bookingService.findOneById(input.id);
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
            updateBooking: this.trpcService
                .roleGuardProcedure(UserRoleEnum.USER, UserRoleEnum.GUEST)
                .input(BookingUpdateDto)
                .mutation(({ input, ctx }) => {
                    const { user } = ctx;
                    return this.bookingService.updateBooking(input, user);
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