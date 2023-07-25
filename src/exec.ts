import type { ChildProcessPromise } from 'promisify-child-process'
import { exec as baseExec } from 'promisify-child-process'
import { ExecOptions } from 'child_process'
import { logCommand, wrapPromise } from './common'

export function exec(
  command: string,
  options?: ExecOptions
): ChildProcessPromise {
  logCommand(command)
  return wrapPromise(baseExec(command, options), `exec failed: ${command}`)
}
