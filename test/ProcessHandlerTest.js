// @flow

import {expect} from 'chai'
import type {ChildProcessPromise} from 'promisify-child-process'
import {describe, it} from 'mocha'

import {range} from 'lodash'

import {spawn} from '../src/spawn'
import {ProcessHandler} from '../src/ProcessHandler'

const childExitPromise = (child: ChildProcessPromise) => {
  child.catch(() => {}) // an error is thrown when a child exits with SIGTERM
  return new Promise((resolve: Function) => child.on('exit', resolve))
}

describe('ProcessSpawner', () => {
  it('kills processes', async function (): Promise<void> {
    this.timeout(250)
    const handler = new ProcessHandler()
    const exitPromise = childExitPromise(handler.spawn('sleep', ['1']))
    handler.killAll()
    await exitPromise
  })
  it('enforces maxProcesses', async function (): Promise<void> {
    this.timeout(250)
    const handler = new ProcessHandler({maxProcesses: 1})

    const processes = range(2).map(() => spawn('sleep', ['1']))
    const exitPromises = processes.map(childExitPromise)

    handler.killOnExit(processes[0])
    expect(() => handler.killOnExit(processes[1])).to.throw('exceeded 1 simultaneous running processes, terminating all child processes')
    await Promise.all(exitPromises)
  })
})
