import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('list')
  async getList(
    @Query('pageNum') pageNum: number,
    @Query('pageSize') pageSize: number,
    @Query('name') name: string,
    @Query('customerNo') customerNo: string,
  ) {
    const data = await this.customerService.getCustomerList({
      pageNum: Number(pageNum) || 1,
      pageSize: Number(pageSize) || 10,
      name,
      customerNo,
    });
    return {
      success: true,
      data,
    };
  }

  @Post('create')
  async create(@Body() body: any) {
    const data = await this.customerService.createCustomer(body);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    const data = await this.customerService.getCustomerDetail(BigInt(id));
    return {
      success: true,
      data,
    };
  }
}
