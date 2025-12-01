export type RequestStatus = "pending" | "in_progress" | "completed" | "rejected";
export type Priority = "low" | "medium" | "high" | "critical";

export interface WorkRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  status: RequestStatus;
  priority: Priority;
  submittedBy: string;
  submittedAt: string;
  assignedTo?: string;
}

export const mockRequests: WorkRequest[] = [
  {
    id: "REQ-1001",
    title: "AC Unit Malfunction in Server Room",
    description: "The AC unit in the main server room is making a loud rattling noise and not cooling effectively. Temperature is rising.",
    location: "Building A, Floor 2, Server Room",
    status: "in_progress",
    priority: "critical",
    submittedBy: "Sarah Connor",
    submittedAt: "2023-10-25T09:30:00Z",
    assignedTo: "Technician User",
  },
  {
    id: "REQ-1002",
    title: "Flickering Lights in Conference Room B",
    description: "The overhead LED panels are flickering intermittently, causing distraction during meetings.",
    location: "Building B, Floor 1, Conf Room B",
    status: "pending",
    priority: "medium",
    submittedBy: "Michael Scott",
    submittedAt: "2023-10-26T14:15:00Z",
  },
  {
    id: "REQ-1003",
    title: "Leaking Faucet in Kitchenette",
    description: "The hot water tap is dripping constantly.",
    location: "Building A, Floor 3, Kitchen",
    status: "completed",
    priority: "low",
    submittedBy: "Pam Beesly",
    submittedAt: "2023-10-24T11:00:00Z",
    assignedTo: "Technician User",
  },
  {
    id: "REQ-1004",
    title: "Broken Office Chair",
    description: "Gas lift mechanism is broken, chair sinks when sat on.",
    location: "Building C, Floor 2, Desk 42",
    status: "rejected",
    priority: "low",
    submittedBy: "Dwight Schrute",
    submittedAt: "2023-10-23T08:45:00Z",
  },
  {
    id: "REQ-1005",
    title: "Projector Connection Issue",
    description: "HDMI port on the main projector seems loose, signal cuts out.",
    location: "Building B, Floor 1, Main Hall",
    status: "pending",
    priority: "high",
    submittedBy: "Jim Halpert",
    submittedAt: "2023-10-27T10:00:00Z",
  },
];
