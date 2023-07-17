import type { ChildProcess, ExecOptions } from 'child_process'
import type { ChildProcessPromise } from 'promisify-child-process'
import nodeCleanup from 'node-cleanup'
import { exec as baseExec } from './exec'
import { execRemote as baseExecRemote, ExecRemoteArgs } from './execRemote'
import { spawn as baseSpawn, SpawnOpts } from './spawn'
export class ProcessHandler {
  _runningProcesses: Map<number, ChildProcess> = new Map()
  _cleanupHandlerInstalled = false
  _curId = 0
  _maxProcesses: number

  constructor({
    maxProcesses,
  }: {
    maxProcesses?: number | null | undefined
  } = {}) {
    this._maxProcesses = maxProcesses || 100
  }

  exec(command: string, options?: ExecOptions): ChildProcessPromise {
    const child = baseExec(command, options)
    this.killOnExit(child)
    return child
  }

  execRemote(args: ExecRemoteArgs): ChildProcessPromise {
    const child = baseExecRemote(args)
    this.killOnExit(child)
    return child
  }

  spawn(
    command: string,
    args?: Array<any> | any,
    options: SpawnOpts = {}
  ): ChildProcessPromise {
    const child = baseSpawn(command, args, options)
    this.killOnExit(child)
    return child
  }

  killOnExit(child: ChildProcess) {
    if (this._runningProcesses.size >= this._maxProcesses) {
      child.kill()
      this.killAll()
      throw Error(
        `exceeded ${this._maxProcesses} simultaneous running processes, terminating all child processes`
      )
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
    for (const child of this._runningProcesses.values()) {
      child.kill()
    }

    this._runningProcesses.clear()
  }
}
