// @flow

import type { ChildProcess } from 'child_process'
import type { ChildProcessPromise } from 'promisify-child-process'

import nodeCleanup from 'node-cleanup'

import { exec as baseExec } from './exec'
import { execRemote as baseExecRemote, type ExecRemoteArgs } from './execRemote'
import { spawn as baseSpawn, type SpawnOpts } from './spawn'

export class ProcessHandler {

  _runningProcesses: Map<number, ChildProcess> = new Map()
  _cleanupHandlerInstalled: boolean = false
  _curId: number = 0
  _maxProcesses: number

  constructor({maxProcesses}: {maxProcesses?: ?number} = {}) {
    this._maxProcesses = maxProcesses || 100
  }

  exec(command: string, options?: child_process$execOpts): ChildProcessPromise {
    const child = baseExec(command, options)
    this.killOnExit(child)
    return child
  }

  execRemote(args: ExecRemoteArgs): ChildProcessPromise {
    const child = baseExecRemote(args)
    this.killOnExit(child)
    return child
  }

  spawn(command: string, args: Array<any> | Object | void, options: SpawnOpts = {}): ChildProcessPromise {
    const child = baseSpawn(command, args, options)
    this.killOnExit(child)
    return child
  }

  killOnExit(child: ChildProcess) {
    if (this._runningProcesses.size >= this._maxProcesses) {
      child.kill()
      this.killAll()
      throw Error(`exceeded ${this._maxProcesses} simultaneous running processes, terminating all child processes`)
    }
    if (!this._cleanupHandlerInstalled) {
      nodeCleanup(() => this.killAll())
      this._cleanupHandlerInstalled = true
    }
    const id = ++this._curId
    child.on('exit', () => this._runningProcesses.delete(id))
    this._runningProcesses.set(id, child)
  }

  killAll() {
    for (const child: ChildProcess of this._runningProcesses.values()) {
      child.kill()
    }
    this._runningProcesses.clear()
  }
}
