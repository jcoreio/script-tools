// @Flow

import {spawn as baseSpawn} from 'promisify-child-process'
import type {SpawnOpts as BaseSpawnOpts, ChildProcessPromise} from 'promisify-child-process'

export type SpawnOpts = BaseSpawnOpts & {
  sudo?: ?boolean,
}

export function spawn(command: string, args: Array<any> | Object | void, options: SpawnOpts = {}): ChildProcessPromise {
  if (!Array.isArray(args)) {
    options = args
    args = []
  }
  if (!args) args = []
  const {sudo, ...optsForSpawn} = options || {}
  if (sudo) {
    args = [command, ...args]
    command = 'sudo'
  }
  return baseSpawn(command, args, {
    stdio: 'inherit',
    ...optsForSpawn,
  })
}
