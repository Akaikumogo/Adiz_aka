import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { EmployeeDayReport } from '../types/analytics'

export function useEmployeeDayReport(
  employeeId: string | null,
  date: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['employee-day', employeeId, date],
    queryFn: () =>
      apiFetch<EmployeeDayReport>(
        `/api/analytics/employees/${employeeId}/day?date=${encodeURIComponent(date)}`,
      ),
    enabled: enabled && Boolean(employeeId),
  })
}
