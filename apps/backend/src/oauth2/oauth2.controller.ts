import { Controller, Get, Inject, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { Oauth2Service } from './oauth2.service';
import { RootConfig } from '../config/config';
import { UserRoleEnum } from '../users/user-role.enum';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { FacebookAuthGuard } from '../guards/facebook-auth.guard';
import { GitHubAuthGuard } from '../guards/github-auth.guard';

@Controller('oauth2')
export class Oauth2Controller {
    constructor(
        private readonly oauth2Service: Oauth2Service,
        @Inject(RootConfig)
        private readonly config: RootConfig,
    ) { }

    cookieOptions: CookieOptions = {
        signed: true,
        httpOnly: true,
        sameSite: 'none',
        secure: true,
    };

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    googleAuth() { }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        return this.handleOAuth2Callback(req, res);
    }

    @Get('facebook')
    @UseGuards(FacebookAuthGuard)
    facebookAuth() { }

    @Get('facebook/callback')
    @UseGuards(FacebookAuthGuard)
    async facebookAuthCallback(@Req() req: Request, @Res() res: Response) {
        return this.handleOAuth2Callback(req, res);
    }

    @Get('github')
    @UseGuards(GitHubAuthGuard)
    githubAuth() { }

    @Get('github/callback')
    @UseGuards(GitHubAuthGuard)
    async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
        return this.handleOAuth2Callback(req, res);
    }

    async handleOAuth2Callback(req: Request, res: Response) {
        if (!req.user) {
            throw new UnauthorizedException('No Facebook user');
        }
        const { access_token, refresh_token } = await this.oauth2Service.oauth2Login(req.user);
        res.cookie('access_token', access_token, {
            ...this.cookieOptions,
            maxAge: this.config.cookie.access_token_max_age,
        });
        res.cookie('refresh_token', refresh_token, {
            ...this.cookieOptions,
            maxAge: this.config.cookie.refresh_token_max_age,
        });
        if (req.user.role === UserRoleEnum.ADMIN) {
            return res.redirect(`${this.config.frontend_url}/admin`);
        }
        else return res.redirect(this.config.frontend_url);
    }
}
