import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomUUID } from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { AccessEventType } from '../database/entities/access-event.entity'

@Injectable()
export class CameraService {
  constructor(private readonly config: ConfigService) {}

  /**
   * Fetches a JPEG from the configured camera URL and saves under SNAPSHOTS_DIR.
   * Returns a path suitable for the API (e.g. /api/files/snapshots/uuid.jpg) or null.
   */
  async captureForAccessEvent(eventType: AccessEventType): Promise<string | null> {
    const url =
      eventType === 'entry'
        ? this.config.get<string>('CAMERA_ENTRY_SNAPSHOT_URL')?.trim()
        : this.config.get<string>('CAMERA_EXIT_SNAPSHOT_URL')?.trim()
    if (!url) return null
    const dir = this.config.get<string>('SNAPSHOTS_DIR', 'uploads/snapshots')
    const timeoutMs = Number(this.config.get('CAMERA_FETCH_TIMEOUT_MS', '8000'))
    try {
      const ac = new AbortController()
      const timer = setTimeout(() => ac.abort(), timeoutMs)
      const res = await fetch(url, { signal: ac.signal })
      clearTimeout(timer)
      if (!res.ok) return null
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 64) return null
      await fs.mkdir(dir, { recursive: true })
      const name = `${randomUUID()}.jpg`
      const fp = path.join(dir, name)
      await fs.writeFile(fp, buf)
      return `/api/files/snapshots/${name}`
    } catch {
      return null
    }
  }
}
