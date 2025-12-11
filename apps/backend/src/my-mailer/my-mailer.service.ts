import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import QRCode from 'qrcode';

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
    async sendETicket(data: ETicketData): Promise<void> {
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
