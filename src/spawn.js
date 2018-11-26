// @Flow

import {spawn as baseSpawn} from 'promisify-child-process'

export const spawn = (command: string, args: Array<any> | Object | void, options: Object | void) => {
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
