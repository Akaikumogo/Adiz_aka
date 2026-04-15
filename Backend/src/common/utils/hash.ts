import { createHash, randomBytes } from 'crypto'

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

export function generateMachineToken(): string {
  return randomBytes(32).toString('hex')
}
