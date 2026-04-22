import { Controller, Post, Body, UnauthorizedException, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.loginName, body.password);
    if (!user) {
      throw new UnauthorizedException('登录失败：账号或密码错误');
    }
    const { access_token } = await this.authService.login(user);
    return {
      token: access_token,
      user: user
    };
  }

  @Get('verify')
  getProfile(@Req() req) {
    return req.user;
  }

  @Get('permissions/me')
  async getMyPermissions(@Req() req) {
    const result = await this.authService.getUserPermissions(req.user.role);
    return {
      success: true,
      data: result,
    };
  }
}
