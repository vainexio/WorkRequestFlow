export type RequestStatus = 
  | "pending" 
  | "denied" 
  | "scheduled" 
  | "ongoing" 
  | "cannot_resolve" 
  | "resolved" 
  | "closed";

export type UrgencyType = "standstill" | "immediately" | "on_occasion" | "during_maintenance";

export interface WorkRequest {
  id: string;
  tswrNo: string;
  assetId: string;
  assetName: string;
  location: string;
  workDescription: string;
  urgency: UrgencyType;
  disruptsOperation: boolean;
  attachmentUrl?: string;
  status: RequestStatus;
  denialReason?: string;
  scheduledDate?: string;
  submittedBy: string;
  submittedById?: string;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  assignedTo?: string;
  resolvedAt?: string;
  closedAt?: string;
  requesterFeedback?: string;
  requesterConfirmedAt?: string;
  turnaroundTime?: number;
  serviceReportId?: string;
}

export interface Asset {
  _id: string;
  assetId: string;
  name: string;
  category: "equipment" | "machine" | "furniture";
  location: string;
  purchaseDate: string;
  purchaseCost: number;
  depreciationRate: number;
  currentValue: number;
  healthScore: number;
  status: "operational" | "under_maintenance" | "out_of_service";
  maintenanceHistory: MaintenanceRecord[];
  lastMaintenanceDate?: string;
  nextScheduledMaintenance?: string;
}

export interface MaintenanceRecord {
  date: string;
  type: "preventive" | "corrective" | "emergency";
  description: string;
  technicianName: string;
  cost: number;
  partsReplaced?: string[];
}

export interface PartMaterial {
  partName: string;
  partNo?: string;
  quantity: number;
  cost: number;
}

export interface ServiceReport {
  _id: string;
  reportId: string;
  tswrNo: string;
  workRequestId?: string;
  assetId: string;
  assetName: string;
  assetCode?: string;
  location: string;
  workDescription: string;
  remarks?: string;
  urgency: UrgencyType;
  workStartTime: string;
  workEndTime: string;
  manHours: number;
  laborCost: number;
  partsMaterials: PartMaterial[];
  totalPartsCost: number;
  serviceType: "planned" | "unplanned";
  hoursDown: number;
  reportFindings: string;
  serviceDate: string;
  preparedBy: string;
  preparedByName: string;
  notedByName?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface PreventiveMaintenance {
  _id: string;
  scheduleId: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "semi_annual" | "annual";
  nextDueDate: string;
  lastCompletedDate?: string;
  assignedTo?: string;
  assignedToName?: string;
  tasks: string[];
  estimatedDuration: number;
  isActive: boolean;
  createdByName: string;
}

export interface User {
  _id: string;
  username: string;
  role: "employee" | "technician" | "manager";
  name: string;
  createdAt: string;
  isArchived?: boolean;
  archivedAt?: string;
}

export interface DashboardStats {
  requests: {
    total: number;
    pending: number;
    scheduled: number;
    ongoing: number;
    resolved: number;
    closed: number;
    denied: number;
    cannotResolve: number;
  };
  assets: {
    total: number;
    operational: number;
    underMaintenance: number;
  };
  technicians: number;
  avgTurnaroundHours: number;
}

export const getStatusColor = (status: RequestStatus): string => {
  const colors: Record<RequestStatus, string> = {
    pending: "bg-blue-500/10 text-blue-600 border-blue-200",
    denied: "bg-red-500/10 text-red-600 border-red-200",
    scheduled: "bg-slate-500/10 text-slate-600 border-slate-200",
    ongoing: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    cannot_resolve: "bg-purple-500/10 text-purple-600 border-purple-200",
    resolved: "bg-green-500/10 text-green-600 border-green-200",
    closed: "bg-gray-500/10 text-gray-600 border-gray-200",
  };
  return colors[status] || "bg-gray-500/10 text-gray-600 border-gray-200";
};

export const getStatusLabel = (status: RequestStatus): string => {
  const labels: Record<RequestStatus, string> = {
    pending: "Pending",
    denied: "Denied",
    scheduled: "Scheduled",
    ongoing: "Ongoing",
    cannot_resolve: "Cannot Resolve",
    resolved: "Resolved",
    closed: "Closed",
  };
  return labels[status] || status;
};

export const getUrgencyLabel = (urgency: UrgencyType): string => {
  const labels: Record<UrgencyType, string> = {
    standstill: "Stand Still",
    immediately: "Immediately",
    on_occasion: "On Occasion",
    during_maintenance: "During Maintenance",
  };
  return labels[urgency] || urgency;
};

export const getUrgencyColor = (urgency: UrgencyType): string => {
  const colors: Record<UrgencyType, string> = {
    standstill: "bg-gray-100 text-gray-700",
    immediately: "bg-red-100 text-red-700",
    on_occasion: "bg-orange-100 text-orange-700",
    during_maintenance: "bg-blue-100 text-blue-700",
  };
  return colors[urgency] || "bg-gray-100 text-gray-700";
};
