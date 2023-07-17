import { spawn as baseSpawn } from 'promisify-child-process'
import { SpawnOptions as BaseSpawnOpts } from 'child_process'
import { Readable, Writable } from 'stream'
import type {
  ChildProcessPromise,
  PromisifySpawnOptions,
} from 'promisify-child-process'
import { logCommand, wrapPromise } from './common'
export type SpawnOpts = BaseSpawnOpts & {
  sudo?: boolean | null | undefined
  prefix?: string | null | undefined
  captureStdio?: boolean | null | undefined
}
export function spawn(
  command: string,
  args?: Array<any> | any,
  options: SpawnOpts = {}
): ChildProcessPromise {
  if (!Array.isArray(args)) {
    options = args
    args = []
  }

  if (!args) args = []
  const { sudo, prefix, captureStdio, ...optsForSpawn } = options || {}

  if (sudo) {
    args = [command, ...args]
    command = 'sudo'
  }

  const commandAndArgs = `${command}${
    args && args.length ? ' ' + args.join(' ') : ''
  }`
  logCommand(commandAndArgs)
  const child = baseSpawn(command, args, {
    stdio: captureStdio || prefix ? 'pipe' : 'inherit',
    encoding: 'utf8',
    ...optsForSpawn,
  } as PromisifySpawnOptions)

  if (captureStdio || prefix) {
    const forward = (src: Readable | null | undefined, dest: Writable) => {
      // eslint-disable-line no-undef
      if (src) {
        src.on('data', (data: string | Buffer) => {
          if (prefix) dest.write(prefix, 'utf8')
          dest.write(data)
        })
      }
    }

    forward(child.stdout, process.stdout)
    forward(child.stderr, process.stderr)
  }

  return wrapPromise(child, `spawn failed: ${commandAndArgs}`)
}
