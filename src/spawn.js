// @Flow

import {spawn as baseSpawn} from 'promisify-child-process'
import type {SpawnOpts as BaseSpawnOpts, ChildProcessPromise} from 'promisify-child-process'

export type SpawnOpts = BaseSpawnOpts & {
  sudo?: ?boolean,
  prefix?: ?string,
}

export function spawn(command: string, args: Array<any> | Object | void, options: SpawnOpts = {}): ChildProcessPromise {
  if (!Array.isArray(args)) {
    options = args
    args = []
  }
  if (!args) args = []
  const {sudo, prefix, ...optsForSpawn} = options || {}
  if (sudo) {
    args = [command, ...args]
    command = 'sudo'
  }
  const child = baseSpawn(command, args, {
    stdio: prefix ? 'pipe' : 'inherit',
    encoding: 'utf8',
    ...optsForSpawn,
  })
  if (prefix) {
    const forward = (src: ?stream$Readable, dest: stream$Writable) => { // eslint-disable-line no-undef
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
