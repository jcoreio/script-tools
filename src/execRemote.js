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
    ...(prefix ? {stdio: 'pipe'} : {}),
    ...(spawnOpts || {}),
  }

  const child: ChildProcessPromise = spawn('ssh', ['-t', '-t',
    ...(strictHostKeyChecking ? [] : ['-o', 'StrictHostKeyChecking=no']),
    ...(user ? ['-l', user] : []),
    ...(keyFile ? ['-i', keyFile] : []),
    host, command], baseSpawnOpts)

  if (prefix) {
    const forward = (src: ?stream$Readable, dest: stream$Writable) => {
      if (src) {
        src.on('data', (data: string | Buffer) => {
          dest.write(prefix, 'utf8')
          dest.write(data)
        })
      }
    }
    forward(child.stdout, process.stdout)
    forward(child.stderr, process.stderr)
  }

  return child
}
