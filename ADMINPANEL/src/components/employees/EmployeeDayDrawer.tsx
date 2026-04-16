import {
  FileImageOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import {
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Modal,
  Space,
  Spin,
  Table,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useEmployeeDayReport } from '../../hooks/useEmployeeDayReport'
import { apiUrl } from '../../lib/api'
import { formatDurationSeconds } from '../../lib/format'
import { UI } from '../../lib/labels'
import type { EmployeeDayReport } from '../../types/analytics'

type Row = EmployeeDayReport['breaks'][number] & { key: string }

export function EmployeeDayDrawer(props: {
  open: boolean
  onClose: () => void
  employeeId: string | null
  employeeName: string
  /** YYYY-MM-DD */
  date: string
  onDateChange: (d: string) => void
}) {
  const { open, onClose, employeeId, employeeName, date, onDateChange } = props
  const { data, isLoading } = useEmployeeDayReport(employeeId, date, open)
  const [preview, setPreview] = useState<string | null>(null)

  const breakRows = useMemo<Row[]>(() => {
    if (!data?.breaks.length) return []
    return data.breaks.map((b, i) => ({ ...b, key: `${i}` }))
  }, [data?.breaks])

  const breakCols: ColumnsType<Row> = [
    {
      title: 'Boshlanish',
      dataIndex: 'start',
      render: (v: string) => dayjs(v).format('HH:mm:ss'),
    },
    {
      title: 'Tugash',
      dataIndex: 'end',
      render: (v: string) => dayjs(v).format('HH:mm:ss'),
    },
    {
      title: 'Tur',
      dataIndex: 'kind',
      width: 90,
      render: (k: string) => (k === 'break' ? 'Tanaffus' : 'Tushkun'),
    },
  ]

  return (
    <>
      <Drawer
        title={
          <div>
            <Typography.Text strong className="text-base">
              {employeeName}
            </Typography.Text>
            <div className="mt-2">
              <Space wrap>
                <Typography.Text type="secondary">{UI.pickDate}:</Typography.Text>
                <DatePicker
                  value={dayjs(date)}
                  onChange={(_, ds) => {
                    if (ds) onDateChange(ds)
                  }}
                  allowClear={false}
                  disabledDate={(d) => d.isAfter(dayjs(), 'day')}
                />
              </Space>
            </div>
          </div>
        }
        placement="right"
        width={Math.min(560, typeof window !== 'undefined' ? window.innerWidth - 16 : 560)}
        onClose={onClose}
        open={open}
        destroyOnClose
      >
        {!employeeId ? (
          <Empty description={UI.noData} />
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Spin />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label={UI.officeTime}>
                {formatDurationSeconds(data.officeDurationSeconds)}
              </Descriptions.Item>
              <Descriptions.Item label={UI.pcActive}>
                {formatDurationSeconds(data.pc.activeSeconds)}
              </Descriptions.Item>
              <Descriptions.Item label={UI.pcIdle}>
                {formatDurationSeconds(data.pc.idleSeconds)}
              </Descriptions.Item>
              <Descriptions.Item label={UI.pcBreak}>
                {formatDurationSeconds(data.pc.breakSeconds)}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Typography.Title level={5} className="!mb-2 !font-semibold">
                {UI.entriesList}
              </Typography.Title>
              {data.entries.length === 0 ? (
                <Typography.Text type="secondary">—</Typography.Text>
              ) : (
                <ul className="space-y-2">
                  {data.entries.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200/90 px-3 py-2 dark:border-zinc-700"
                    >
                      <span className="flex items-center gap-2">
                        <LoginOutlined className="text-emerald-600" />
                        {dayjs(e.at).format('HH:mm:ss')}
                      </span>
                      {e.snapshotUrl ? (
                        <Button
                          type="text"
                          size="small"
                          icon={<FileImageOutlined />}
                          onClick={() => setPreview(apiUrl(e.snapshotUrl!))}
                          aria-label={UI.snapshotOpen}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <Typography.Title level={5} className="!mb-2 !font-semibold">
                {UI.exitsList}
              </Typography.Title>
              {data.exits.length === 0 ? (
                <Typography.Text type="secondary">—</Typography.Text>
              ) : (
                <ul className="space-y-2">
                  {data.exits.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200/90 px-3 py-2 dark:border-zinc-700"
                    >
                      <span className="flex items-center gap-2">
                        <LogoutOutlined className="text-amber-600" />
                        {dayjs(e.at).format('HH:mm:ss')}
                      </span>
                      {e.snapshotUrl ? (
                        <Button
                          type="text"
                          size="small"
                          icon={<FileImageOutlined />}
                          onClick={() => setPreview(apiUrl(e.snapshotUrl!))}
                          aria-label={UI.snapshotOpen}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <Typography.Title level={5} className="!mb-2 !font-semibold">
                {UI.breaksList}
              </Typography.Title>
              {breakRows.length === 0 ? (
                <Typography.Text type="secondary">—</Typography.Text>
              ) : (
                <Table<Row>
                  size="small"
                  pagination={false}
                  columns={breakCols}
                  dataSource={breakRows}
                />
              )}
            </div>
          </div>
        ) : (
          <Empty description={UI.noData} />
        )}
      </Drawer>

      <Modal
        open={!!preview}
        footer={null}
        onCancel={() => setPreview(null)}
        width={720}
        centered
        title={UI.snapshotOpen}
      >
        {preview ? (
          <img src={preview} alt="" className="max-h-[70vh] w-full object-contain" />
        ) : null}
      </Modal>
    </>
  )
}
