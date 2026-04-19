export interface IEmployeeProps {
  id: string;
  employeeNo: string;
  name: string;
  gender?: 'male' | 'female';
  phone?: string;
  email?: string;
  departmentId?: string;
  position?: string;
  status?: 'active' | 'resigned' | 'probation';
  currentStatus?: 'on_duty' | 'leave' | 'business_trip' | 'other';
  hireDate?: string;
  leaveDate?: string;
  role?: 'admin' | 'project_manager' | 'hr_manager' | 'equipment_manager' | 'implementer' | 'user';
  dailyCost?: number;
  skills?: any;
  avatarColor?: string;
  userId?: string;
  employeeType?: 'full_time' | 'part_time' | 'contract' | 'intern';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Employee {
  private readonly props: IEmployeeProps;

  constructor(props: IEmployeeProps) {
    this.props = props;
  }

  get id(): string { return this.props.id; }
  get employeeNo(): string { return this.props.employeeNo; }
  get name(): string { return this.props.name; }
  get gender(): 'male' | 'female' | undefined { return this.props.gender; }
  get phone(): string | undefined { return this.props.phone; }
  get email(): string | undefined { return this.props.email; }
  get departmentId(): string | undefined { return this.props.departmentId; }
  get position(): string | undefined { return this.props.position; }
  get status(): 'active' | 'resigned' | 'probation' | undefined { return this.props.status; }
  get currentStatus(): 'on_duty' | 'leave' | 'business_trip' | 'other' | undefined { return this.props.currentStatus; }
  get hireDate(): string | undefined { return this.props.hireDate; }
  get leaveDate(): string | undefined { return this.props.leaveDate; }
  get role(): string | undefined { return this.props.role; }
  get dailyCost(): number | undefined { return this.props.dailyCost; }
  get skills(): any { return this.props.skills; }
  get avatarColor(): string | undefined { return this.props.avatarColor; }
  get userId(): string | undefined { return this.props.userId; }
  get employeeType(): "full_time" | "part_time" | "contract" | "intern" | undefined { return this.props.employeeType; }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  isOnDuty(): boolean {
    return this.props.currentStatus === 'on_duty';
  }

  toJSON(): IEmployeeProps {
    return { ...this.props };
  }

  snapshot(): IEmployeeProps {
    return { ...this.props };
  }
}
