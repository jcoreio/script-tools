// @flow

import type {ChildProcessPromise} from 'promisify-child-process'
import {exec as baseExec} from 'promisify-child-process'

import {logCommand, wrapPromise} from './common'

export function exec(command: string, options?: child_process$execOpts): ChildProcessPromise {
  logCommand(command)
  return wrapPromise(baseExec(command, options), `exec failed: ${command}`)
}
