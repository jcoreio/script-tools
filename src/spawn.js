// @Flow

import {spawn as baseSpawn} from 'promisify-child-process'
import type {SpawnOpts as BaseSpawnOpts, ChildProcessPromise} from 'promisify-child-process'

import {logCommand, wrapPromise} from './common'

export type SpawnOpts = BaseSpawnOpts & {
  sudo?: ?boolean,
  prefix?: ?string,
  captureStdio?: ?boolean, // forward stdio to the calling process while also buffering it
}

export function spawn(command: string, args: Array<any> | Object | void, options: SpawnOpts = {}): ChildProcessPromise {
  if (!Array.isArray(args)) {
    options = args
    args = []
  }
  if (!args) args = []
  const {sudo, prefix, captureStdio, ...optsForSpawn} = options || {}
  if (sudo) {
    args = [command, ...args]
    command = 'sudo'
  }
  const commandAndArgs = `${command}${args && args.length ? ' ' + args.join(' ') : ''}`
  logCommand(commandAndArgs)
  const child = baseSpawn(command, args, {
    stdio: (captureStdio || prefix) ? 'pipe' : 'inherit',
    encoding: 'utf8',
    ...optsForSpawn,
  })
  if (captureStdio || prefix) {
    const forward = (src: ?stream$Readable, dest: stream$Writable) => { // eslint-disable-line no-undef
      if (src) {
        src.on('data', (data: string | Buffer) => {
          if (prefix)
            dest.write(prefix, 'utf8')
          dest.write(data)
        })
      }
    }
    forward(child.stdout, process.stdout)
    forward(child.stderr, process.stderr)
  }
  return wrapPromise(child, `spawn failed: ${commandAndArgs}`)
}
