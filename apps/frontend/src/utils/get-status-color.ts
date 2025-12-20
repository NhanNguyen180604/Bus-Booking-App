import { PaymentStatusEnum } from "@repo/shared";

export const getStatusColor = (status: PaymentStatusEnum) => {
    switch (status) {
        case PaymentStatusEnum.COMPLETED:
            return 'success';
        case PaymentStatusEnum.REFUNDED:
        case PaymentStatusEnum.EXPIRED:
            return 'danger';
        case PaymentStatusEnum.PROCESSING:
            return 'warning';
        default:
            return 'secondary-text';
    }
};