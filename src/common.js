// @flow

import chalk from 'chalk'
import type {ChildProcessPromise} from 'promisify-child-process'
import {VError} from 'verror'

export function logCommand(command: string) {
  console.log(chalk.gray(`+ ${command}`))
}

export function wrapPromise(child: ChildProcessPromise, errMsg: string): ChildProcessPromise {
  const wrappedPromise = child.catch((err: Error) => {
    const wrappedErr = new VError(err, errMsg)
    for (let key of ['code', 'signal', 'stdout', 'stderr']) {
      if (err.hasOwnProperty(key))
        wrappedErr[key] = (err: any)[key]
    }
    throw wrappedErr
  })
  return (Object.create((child: any), {
    then: { value: wrappedPromise.then.bind(wrappedPromise) },
    catch: { value: wrappedPromise.catch.bind(wrappedPromise) },
  }): any)
}
