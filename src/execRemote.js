// @flow

import {spawn, type SpawnOpts} from './spawn'
import type {ChildProcessPromise} from 'promisify-child-process'

// The -t -t option causes the remote process to be killed when this process is killed: https://unix.stackexchange.com/questions/103699/kill-process-spawned-by-ssh-when-ssh-dies
export function execRemote({host, user, keyFile, command, strictHostKeyChecking, prefix, spawnOpts}: {
  host: string,
  user?: ?string,
  keyFile?: ?string,
  command: string,
  strictHostKeyChecking?: ?boolean,
  prefix?: ?string,
  spawnOpts?: ?SpawnOpts,
}): ChildProcessPromise {
  const baseSpawnOpts = {
    ...(prefix ? {prefix} : {}),
    ...(spawnOpts || {})
  }
  return spawn('ssh', ['-t', '-t',
    ...(strictHostKeyChecking ? [] : ['-o', 'StrictHostKeyChecking=no']),
    ...(user ? ['-l', user] : []),
    ...(keyFile ? ['-i', keyFile] : []),
    host, command], baseSpawnOpts)
}
