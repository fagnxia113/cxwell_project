import { singleton } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { Customer } from '../domain/Customer.entity.js';
import type { ICustomerRepository, CustomerQueryParams } from '../domain/ICustomerRepository.js';

@singleton()
export class PrismaCustomerRepository implements ICustomerRepository {
  private mapToEntity(row: any): Customer {
    return new Customer({
      id: row.id,
      customerNo: row.customer_no,
      name: row.name,
      contact: row.contact,
      phone: row.phone,
      address: row.address,
      notes: row.notes,
      type: row.type
    });
  }

  async findById(id: string): Promise<Customer | null> {
    const row = await prisma.customers.findUnique({ where: { id } });
    return row ? this.mapToEntity(row) : null;
  }

  async findByCustomerNo(customerNo: string): Promise<Customer | null> {
    const row = await prisma.customers.findUnique({ where: { customer_no: customerNo } });
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(params?: CustomerQueryParams): Promise<{ data: Customer[]; total: number }> {
    const where: any = {};
    if (params?.type) where.type = params.type;
    
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { customer_no: { contains: params.search } },
        { contact: { contains: params.search } }
      ];
    }

    const { page = 1, pageSize = 20 } = params || {};
    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.customers.count({ where })
    ]);

    return {
      data: rows.map(row => this.mapToEntity(row)),
      total
    };
  }

  async create(customer: Customer): Promise<Customer> {
    const row = await prisma.customers.create({
      data: {
        id: customer.id,
        customer_no: customer.customerNo,
        name: customer.name,
        contact: customer.contact,
        phone: customer.phone,
        address: customer.address || null,
        notes: customer.notes || null,
        type: (customer.type as any) || 'enterprise',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    return this.mapToEntity(row);
  }

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const data: any = {
      updated_at: new Date()
    };
    if (customer.customerNo !== undefined) data.customer_no = customer.customerNo;
    if (customer.name !== undefined) data.name = customer.name;
    if (customer.contact !== undefined) data.contact = customer.contact;
    if (customer.phone !== undefined) data.phone = customer.phone;
    if (customer.address !== undefined) data.address = customer.address;
    if (customer.notes !== undefined) data.notes = customer.notes;
    if (customer.type !== undefined) data.type = customer.type;

    const row = await prisma.customers.update({
      where: { id },
      data
    });
    return this.mapToEntity(row);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.customers.delete({ where: { id } });
    return true;
  }

  async count(where?: any): Promise<number> {
    return prisma.customers.count({ where });
  }
}
