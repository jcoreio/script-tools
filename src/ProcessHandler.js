// @flow

import type { ChildProcess } from 'child_process'
import { exec as baseExec, type ChildProcessPromise } from 'promisify-child-process'
import { VError } from 'verror'

import nodeCleanup from 'node-cleanup'

import { spawn as baseSpawn, type SpawnOpts } from './spawn'
import { execRemote as baseExecRemote, type ExecRemoteArgs } from './execRemote'

export class ProcessHandler {

  _runningProcesses: Map<number, ChildProcess> = new Map()
  _cleanupHandlerInstalled: boolean = false
  _curId: number = 0
  _maxProcesses: number
  _printCommands: boolean

  constructor({maxProcesses, printCommands}: {maxProcesses?: ?number, printCommands?: ?boolean} = {}) {
    this._maxProcesses = maxProcesses || 100
    this._printCommands = !!printCommands
  }

  exec(command: string, options?: child_process$execOpts): ChildProcessPromise {
    this._maybePrintCommand(`+ ${command}`)
    const child = baseExec(command, options)
    this.killOnExit(child)
    child.catch((err: Error) => {
      throw new VError(err, `exec failed: ${command}`)
    })
    return child
  }

  execRemote(args: ExecRemoteArgs): ChildProcessPromise {
    this._maybePrintCommand(`+ host: ${args.host} command: ${args.command}`)
    const child = baseExecRemote(args)
    this.killOnExit(child)
    child.catch((err: Error) => {
      throw new VError(err, `execRemote on host ${args.host} failed: ${args.command}`)
    })
    return child
  }

  spawn(command: string, args: Array<any> | Object | void, options: SpawnOpts = {}): ChildProcessPromise {
    const commandAndArgs = `${command}${args && args.length ? ' ' + args.join(' ') : ''}`
    this._maybePrintCommand(`+ ${commandAndArgs}`)
    const child = baseSpawn(command, args, options)
    this.killOnExit(child)
    child.catch((err: Error) => {
      throw new VError(err, `spawn failed: ${commandAndArgs}`)
    })
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

  _maybePrintCommand(...args: Array<any>) {
    if (this._printCommands)
      console.log(...args)
  }

}
