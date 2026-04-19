import { singleton, inject } from 'tsyringe';
import { Customer } from '../domain/Customer.entity.js';
import type { ICustomerRepository, CustomerQueryParams } from '../domain/ICustomerRepository.js';
import { v4 as uuidv4 } from 'uuid';

@singleton()
export class CustomerUseCase {
  constructor(
    @inject('ICustomerRepository') private repository: ICustomerRepository
  ) {}

  async createCustomer(data: any): Promise<Customer> {
    const customer = new Customer({
      ...data,
      id: uuidv4(),
      customerNo: data.customer_no || `CUST-${Date.now()}`
    });
    return this.repository.create(customer);
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.repository.findById(id);
  }

  async getCustomers(params?: CustomerQueryParams): Promise<{ data: Customer[]; total: number }> {
    return this.repository.findAll(params);
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    return this.repository.update(id, data);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    // Basic deletion for now. 
    // In many enterprise systems, customers are not hard-deleted if they have associated orders.
    // I will stick to the basic delete for now to match legacy behavior.
    return this.repository.delete(id);
  }
}
