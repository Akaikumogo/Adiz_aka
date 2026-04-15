import { UserOutlined } from '@ant-design/icons'
import { Avatar, Progress, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { DailyRecord, Employee } from '../types/activity'
import { efficiencyColor, minutesToHHMM } from '../lib/format'
import { UI } from '../lib/labels'

interface ActivityTableProps {
  rows: DailyRecord[]
  employees: Map<string, Employee>
  loading?: boolean
  onRowClick: (record: DailyRecord) => void
}

export function ActivityTable({
  rows,
  employees,
  loading,
  onRowClick,
}: ActivityTableProps) {
  const columns: ColumnsType<DailyRecord> = [
    {
      title: UI.colEmployee,
      dataIndex: 'employeeId',
      key: 'employee',
      sorter: (a, b) => {
        const na = employees.get(a.employeeId)?.name ?? ''
        const nb = employees.get(b.employeeId)?.name ?? ''
        return na.localeCompare(nb)
      },
      render: (_, r) => {
        const e = employees.get(r.employeeId)
        const label = e?.name ?? r.employeeName ?? r.employeeId
        return (
          <div className="flex items-center gap-2">
            <Avatar src={e?.avatar} icon={<UserOutlined />}>
              {label[0]}
            </Avatar>
            <span className="font-medium">{label}</span>
          </div>
        )
      },
    },
    {
      title: UI.colDate,
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => a.date.localeCompare(b.date),
      defaultSortOrder: 'descend',
    },
    {
      title: UI.colOfficeIn,
      dataIndex: 'officeIn',
      key: 'officeIn',
      sorter: (a, b) => a.officeIn.localeCompare(b.officeIn),
    },
    {
      title: UI.colRoomIn,
      dataIndex: 'roomIn',
      key: 'roomIn',
      sorter: (a, b) => a.roomIn.localeCompare(b.roomIn),
    },
    {
      title: UI.colActive,
      dataIndex: 'activeTime',
      key: 'activeTime',
      sorter: (a, b) => a.activeTime - b.activeTime,
      render: (v: number) => minutesToHHMM(v),
    },
    {
      title: UI.colIdle,
      dataIndex: 'idleTime',
      key: 'idleTime',
      sorter: (a, b) => a.idleTime - b.idleTime,
      render: (v: number) => minutesToHHMM(v),
    },
    {
      title: UI.colLunch,
      dataIndex: 'lunchTime',
      key: 'lunchTime',
      sorter: (a, b) => a.lunchTime - b.lunchTime,
      render: (v: number) => minutesToHHMM(v),
    },
    {
      title: UI.colOfficeOut,
      dataIndex: 'officeOut',
      key: 'officeOut',
      sorter: (a, b) => a.officeOut.localeCompare(b.officeOut),
    },
    {
      title: UI.colEfficiency,
      dataIndex: 'efficiency',
      key: 'efficiency',
      sorter: (a, b) => a.efficiency - b.efficiency,
      render: (v: number) => (
        <div className="min-w-[120px]">
          <Progress
            percent={v}
            size="small"
            strokeColor={efficiencyColor(v)}
            format={(p) => `${p}%`}
          />
        </div>
      ),
    },
  ]

  return (
    <Table<DailyRecord>
      rowKey={(r) => r.id ?? `${r.employeeId}-${r.date}`}
      loading={loading}
      columns={columns}
      dataSource={rows}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      scroll={{ x: 1100 }}
      className="activity-table"
      onRow={(record) => ({
        onClick: () => onRowClick(record),
        className: 'cursor-pointer activity-table-row',
      })}
    />
  )
}
