import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    console.log('Login request body:', body);
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

  @UseGuards(AuthGuard('jwt'))
  @Get('verify')
  getProfile(@Req() req) {
    return req.user;
  }

  /**
   * 获取当前登录用户的权限码与菜单位
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('permissions/me')
  async getMyPermissions(@Req() req) {
    const result = await this.authService.getUserPermissions(req.user.role);
    return {
      success: true,
      data: result,
    };
  }
}
