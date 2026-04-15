export type TimelineEventType =
  | 'door_in'
  | 'door_out'
  | 'pc_active'
  | 'idle_start'
  | 'lunch'

export interface Employee {
  id: string
  name: string
  avatar: string
  department: string
  position: string
  status: 'active' | 'away' | 'offline'
  departmentId?: string | null
}

export interface TimelineEvent {
  timestamp: string
  type: TimelineEventType
}

export type ActivitySegmentKind = 'active' | 'idle' | 'lunch'

export interface ActivitySegment {
  kind: ActivitySegmentKind
  startMin: number
  endMin: number
}

export interface DailyRecord {
  id?: string
  employeeName?: string | null
  employeeId: string
  date: string
  officeIn: string
  roomIn: string
  officeOut: string
  activeTime: number
  idleTime: number
  lunchTime: number
  efficiency: number
  timelineEvents: TimelineEvent[]
  segments: ActivitySegment[]
}

export interface EmployeeSummary extends Employee {
  avgEfficiency: number
  recordsCount: number
  lastActivityDate: string | null
}
