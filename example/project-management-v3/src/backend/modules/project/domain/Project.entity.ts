import { v4 as uuidv4 } from 'uuid';
import { TaskStatus, TaskPriority } from './Task.entity.js';

export type ProjectType = 'domestic' | 'foreign' | 'rd' | 'service';
export type ProjectStatus = 'proposal' | 'in_progress' | 'completed' | 'paused' | 'delayed';

export interface IProjectProps {
  id?: string;
  code: string;
  name: string;
  type?: ProjectType;
  managerId?: string;
  managerName?: string;
  status?: ProjectStatus;
  progress?: number;
  startDate: Date | string;
  endDate?: Date | string;
  budget?: number;
  customerId?: string;
  customerName?: string;
  organizationId?: string;
  description?: string;
  country?: string;
  address?: string;
  attachments?: string;
  phase?: string;
  phaseStartDate?: Date | string;
  phaseEndDate?: Date | string;
  estimatedDays?: number;
  remainingDays?: number;
  buildingArea?: number;
  itCapacity?: number;
  cabinetCount?: number;
  cabinetPower?: number;
  powerArchitecture?: string;
  hvacArchitecture?: string;
  fireArchitecture?: string;
  weakElectricArchitecture?: string;
  approvalMode?: string;
  technicalLeadId?: string;
  endCustomer?: string;
  rackPower?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}


export class Project {
  private props: IProjectProps;

  constructor(props: IProjectProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      status: props.status || 'proposal',
      progress: props.progress || 0,
      type: props.type || 'domestic',
      country: props.country || '中国',
      approvalMode: props.approvalMode || 'workflow'
    };
  }

  get id(): string { return this.props.id!; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get status(): ProjectStatus { return this.props.status!; }

  public updateStatus(status: ProjectStatus) {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  public updateProgress(progress: number) {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    this.props.progress = progress;
    this.props.updatedAt = new Date();
  }

  public toJSON() {
    return {
      ...this.props,
      // For backward compatibility with legacy frontend
      start_date: this.props.startDate,
      end_date: this.props.endDate,
      manager_id: this.props.managerId,
      manager: this.props.managerName, // Frontend often uses project.manager for the name
      customer_name: this.props.customerName,
      customerId: this.props.customerId,
      customer_id: this.props.customerId,
      project_no: this.props.code, // Alias for code if needed
      building_area: this.props.buildingArea,
      it_capacity: this.props.itCapacity,
      cabinet_count: this.props.cabinetCount,
      cabinet_power: this.props.cabinetPower,
      power_architecture: this.props.powerArchitecture,
      hvac_architecture: this.props.hvacArchitecture,
      fire_architecture: this.props.fireArchitecture,
      weak_electric_architecture: this.props.weakElectricArchitecture,
      technical_lead_id: this.props.technicalLeadId,
      end_customer: this.props.endCustomer,
      rack_power: this.props.rackPower
    };
  }
}
