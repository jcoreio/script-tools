import chalk from 'chalk'
import type { ChildProcessPromise } from 'promisify-child-process'
import { VError } from 'verror'
export function logCommand(command: string) {
  console.log(chalk.gray(`+ ${command}`))
}
export function wrapPromise(
  child: ChildProcessPromise,
  errMsg: string
): ChildProcessPromise {
  const wrappedPromise = child.catch((err: Error) => {
    const wrappedErr = new VError(err, errMsg)

    for (const key of ['code', 'signal', 'stdout', 'stderr']) {
      if (Object.prototype.hasOwnProperty.call(err, key))
        (wrappedErr as any)[key] = (err as any)[key]
    }

    throw wrappedErr
  })
  return Object.create(child as any, {
    then: { value: wrappedPromise.then.bind(wrappedPromise) },
    catch: { value: wrappedPromise.catch.bind(wrappedPromise) },
  }) as any
}
