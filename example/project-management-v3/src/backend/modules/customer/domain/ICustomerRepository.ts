import { Customer } from './Customer.entity.js';

export interface CustomerQueryParams {
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByCustomerNo(customerNo: string): Promise<Customer | null>;
  findAll(params?: CustomerQueryParams): Promise<{ data: Customer[]; total: number }>;
  create(customer: Customer): Promise<Customer>;
  update(id: string, customer: Partial<Customer>): Promise<Customer>;
  delete(id: string): Promise<boolean>;
  count(where?: any): Promise<number>;
}
