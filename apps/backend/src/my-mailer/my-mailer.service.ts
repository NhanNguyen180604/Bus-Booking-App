import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import QRCode from 'qrcode';
import { Booking } from 'src/entities/booking.entity';

interface ETicketData {
    email: string;
    fullName: string;
    bookingCode: string;
    origin: string;
    destination: string;
    departureDateTime: string;
    seatCodes: string[];
    totalPrice: string;
    token: string; // Used to generate QR code
}

@Injectable()
export class MyMailerService {
    private readonly logger = new Logger(MyMailerService.name);

    constructor(private readonly mailerService: MailerService) { }

    /**
     * Send e-ticket email to customer after successful booking confirmation
     */
    async sendETicket(booking: Booking): Promise<void> {
        const departureDateTime = new Date(booking.trip.departureTime).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
        const totalPrice = new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'VND',
            currencyDisplay: 'code',
        }).format(Math.ceil(Number(booking.totalPrice)));
        const seatCodes = booking.seats.map(seat => seat.code);

        const data: ETicketData = {
            email: booking.email,
            fullName: booking.fullName,
            bookingCode: booking.lookupCode,
            origin: booking.trip.route.origin.name,
            destination: booking.trip.route.destination.name,
            departureDateTime,
            seatCodes,
            totalPrice,
            token: booking.token,
        };

        try {
            // Generate QR code from booking token
            const qrCodeDataUrl = await QRCode.toDataURL(data.token, {
                errorCorrectionLevel: 'H' as const,
                type: 'image/png' as const,
                margin: 1,
                width: 300,
            });

            // Convert data URL to buffer for email attachment
            const qrCodeBuffer = Buffer.from(
                qrCodeDataUrl.replace(/^data:image\/png;base64,/, ''),
                'base64'
            );

            await this.mailerService.sendMail({
                to: data.email,
                subject: `E-Ticket Confirmation - ${data.bookingCode}`,
                template: 'eticket',
                context: {
                    fullName: data.fullName,
                    bookingCode: data.bookingCode,
                    origin: data.origin,
                    destination: data.destination,
                    departureDateTime: data.departureDateTime,
                    seatCodes: data.seatCodes,
                    totalPrice: data.totalPrice,
                },
                attachments: [
                    {
                        filename: 'qrcode.png',
                        content: qrCodeBuffer,
                        cid: 'qrcode', // Content-ID for embedding in HTML
                    },
                ],
            });

            this.logger.log(
                `E-ticket sent successfully to ${data.email} for booking ${data.bookingCode}`
            );
        } catch (error) {
            this.logger.error(
                `Failed to send e-ticket to ${data.email}:`,
                error instanceof Error ? error.message : 'Unknown error'
            );
            throw error;
        }
    }
}
