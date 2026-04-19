export class Customer {
  id: string;
  customerNo: string;
  name: string;
  contact: string;
  phone: string;
  address?: string;
  notes?: string;
  type?: 'enterprise' | 'individual'; // Based on customers_type enum in schema

  constructor(data: Partial<Customer>) {
    this.id = data.id || '';
    this.customerNo = data.customerNo || '';
    this.name = data.name || '';
    this.contact = data.contact || '';
    this.phone = data.phone || '';
    this.address = data.address;
    this.notes = data.notes;
    this.type = data.type || 'enterprise';
  }

  toJSON() {
    return {
      id: this.id,
      customer_no: this.customerNo,
      name: this.name,
      contact: this.contact,
      phone: this.phone,
      address: this.address,
      notes: this.notes,
      type: this.type
    };
  }
}
