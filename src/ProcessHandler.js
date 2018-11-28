// @flow

import chalk from 'chalk'
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
    this._maybePrintCommand(command)
    const child = baseExec(command, options)
    return this._wrapPromise(child, (err: Error) => new VError(err, `exec failed: ${command}`))
  }

  execRemote(args: ExecRemoteArgs): ChildProcessPromise {
    this._maybePrintCommand(`host: ${args.host} command: ${args.command}`)
    const child = baseExecRemote(args)
    return this._wrapPromise(child, (err: Error) => new VError(err, `execRemote on host ${args.host} failed: ${args.command}`))
  }

  spawn(command: string, args: Array<any> | Object | void, options: SpawnOpts = {}): ChildProcessPromise {
    const commandAndArgs = `${command}${args && args.length ? ' ' + args.join(' ') : ''}`
    this._maybePrintCommand(commandAndArgs)
    const child = baseSpawn(command, args, options)
    return this._wrapPromise(child, (err: Error) => new VError(err, `spawn failed: ${commandAndArgs}`))
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

  _maybePrintCommand(command: string) {
    if (this._printCommands)
      console.log(chalk.gray(`+ ${command}`))
  }

  _wrapPromise(child: ChildProcessPromise, transformError: (err: Error) => Error): ChildProcessPromise {
    this.killOnExit(child)
    const wrappedPromise = child.catch((err: Error) => {
      throw transformError(err)
    })
    return (Object.create((child: any), {
      then: { value: wrappedPromise.then.bind(wrappedPromise) },
      catch: { value: wrappedPromise.catch.bind(wrappedPromise) },
    }): any)
  }
}
