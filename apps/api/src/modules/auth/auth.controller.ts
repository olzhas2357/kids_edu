import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, Public } from '@/common/decorators';
import type { AuthUser } from '@/common/types';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: AuthCookieService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new teacher or student account' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.register(dto);
    this.cookieService.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.login(dto);
    this.cookieService.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.cookieService.getRefreshTokenFromCookies(req.cookies ?? {});
    const { user, tokens } = await this.authService.refresh(refreshToken ?? '');
    this.cookieService.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.cookieService.getRefreshTokenFromCookies(req.cookies ?? {});
    await this.authService.logout(refreshToken);
    this.cookieService.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user);
  }
}
