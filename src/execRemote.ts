import { spawn, SpawnOpts } from './spawn'
import type { ChildProcessPromise } from 'promisify-child-process'
export type ExecRemoteArgs = {
  host: string
  user?: string | null | undefined
  keyFile?: string | null | undefined
  command: string
  strictHostKeyChecking?: boolean | null | undefined
  prefix?: string | null | undefined
  spawnOpts?: SpawnOpts | null | undefined
}
export function execRemote({
  host,
  user,
  keyFile,
  command,
  strictHostKeyChecking,
  prefix,
  spawnOpts,
}: ExecRemoteArgs): ChildProcessPromise {
  const baseSpawnOpts = {
    ...(prefix ? { prefix } : {}),
    ...(spawnOpts || {}),
  } as const // The -t -t option causes the remote process to be killed when this process is killed: https://unix.stackexchange.com/questions/103699/kill-process-spawned-by-ssh-when-ssh-dies

  return spawn(
    'ssh',
    [
      '-t',
      '-t',
      ...(strictHostKeyChecking ? [] : ['-o', 'StrictHostKeyChecking=no']),
      ...(user ? ['-l', user] : []),
      ...(keyFile ? ['-i', keyFile] : []),
      host,
      command,
    ],
    baseSpawnOpts
  )
}
