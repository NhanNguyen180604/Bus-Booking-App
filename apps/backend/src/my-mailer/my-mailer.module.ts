import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { RootConfig } from 'src/config/config';
import { MyMailerService } from './my-mailer.service';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
    imports: [
        MailerModule.forRootAsync({
            inject: [RootConfig],
            useFactory: (config: RootConfig) => ({
                transport: {
                    host: 'localhost',
                    port: 8000,
                    service: 'gmail',
                    ignoreTLS: true,
                    secure: false,
                    auth: {
                        user: config.send_mail.user,
                        pass: config.send_mail.app_password,
                    },
                },
                preview: true,
                defaults: {
                    from: `"Bus Booking App" <${config.send_mail.user}>`,
                },
                template: {
                    dir: __dirname + '/templates',
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: false,
                    },
                },
            }),
        }),
    ],
    providers: [MyMailerService],
    exports: [MyMailerService],
})
export class MyMailerModule { }
