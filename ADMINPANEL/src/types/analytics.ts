export type EmployeeDayReport = {
  employeeId: string
  fullName: string
  date: string
  entries: { id: string; at: string; snapshotUrl: string | null }[]
  exits: { id: string; at: string; snapshotUrl: string | null }[]
  officeDurationSeconds: number
  pc: {
    activeSeconds: number
    idleSeconds: number
    breakSeconds: number
  }
  breaks: { start: string; end: string; kind: 'break' | 'idle' }[]
}

export type EmployeesActivitySummaryRow = {
  employeeId: string
  recordsCount: number
  lastActivityAt: string | null
}

export type AccessTurnstileSummary = {
  entryCount: number
  exitCount: number
  byEmployee: { employeeId: string; fullName: string; entries: number; exits: number }[]
}

export type ComputerDayReport = {
  computer: {
    id: string
    name: string
    macAddress: string
    lastSeenAt: string | null
  }
  employee: { id: string; fullName: string } | null
  room: { id: string; name: string } | null
  date: string
  totalEvents: number
  byStatus: { working: number; idle: number; break: number }
  samples: { at: string; status: string }[]
}
