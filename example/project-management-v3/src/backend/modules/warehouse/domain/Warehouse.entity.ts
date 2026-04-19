export interface IWarehouseProps {
  id: string;
  warehouseNo: string;
  name: string;
  type?: 'main' | 'branch' | 'project';
  location?: string;
  address?: string;
  managerId?: string;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Warehouse {
  private readonly props: IWarehouseProps;

  constructor(props: IWarehouseProps) {
    this.props = props;
  }

  get id(): string { return this.props.id; }
  get warehouseNo(): string { return this.props.warehouseNo; }
  get name(): string { return this.props.name; }
  get type(): 'main' | 'branch' | 'project' | undefined { return this.props.type; }
  get location(): string | undefined { return this.props.location; }
  get address(): string | undefined { return this.props.address; }
  get managerId(): string | undefined { return this.props.managerId; }
  get status(): 'active' | 'inactive' | undefined { return this.props.status; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }
  get deletedAt(): Date | null | undefined { return this.props.deletedAt; }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  isMainWarehouse(): boolean {
    return this.props.type === 'main';
  }

  toJSON(): any {
    return { 
      ...this.props,
      warehouse_no: this.props.warehouseNo // 兼容前端字段名
    };
  }

  snapshot(): IWarehouseProps {
    return { ...this.props };
  }
}
