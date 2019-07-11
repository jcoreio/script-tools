# JCore Script Tools

Helpers for common scripting tasks like modifying configuration files

## Installation

`npm install --save @jcoreio/script-tools`

or

`yarn add @jcoreio/script-tools`

## Standalone Functions

####`exec`

Promisified version of `child_process.exec` that also prints the command being called and
and includes the original command in any error message

```js
const {exec} = require('@jcoreio/script-tools')

const stdout = (await exec('git pull')).stdout
```

####`execRemote`

Executes a command on a remote host via SSH. Disables SSH host key checking by default.
To re-enable SSH host key checking, pass `strictHostKeyChecking: true`.

Options:
- `host`: string, required: remote hostname
- `user`: string, optional: username for remote login
- `keyFile`: string, optional: location of the SSH key pair to access the remote host
- `command`: string, required: command to run on the remote host
- `prefix`: string, optional: optionally prefix piped output with the specified value. Disabled by default.
- `spawnOpts:`
  - `sudo`: boolean, optional: true if the ssh command should be run with sudo. Defaults to false.
  - `captureStdio`: boolean, optional: true if the process's stdio should be captured for later use as well as being piped through to the parent process. Defaults to false.
  
```js
const {execRemote} = require('@jcoreio/script-tools')

await execRemote({
  host: 'remotehost.com',
  user: 'ubuntu',
  keyFile: '~/key.pem',
  command: 'sudo reboot',
  spawnOpts: {
    captureStdio: true
  }
})
```

####`lineInFile`

Ensures that a line exists in a file. Optionally replaces a line matching a specified pattern.

Options:
- `file`: string, required: path of the destination file
- `line`: string, required: line to add or replace
- `replace`: string, optional: pattern of line to replace
- `insertAfter`: string, optional: insert the line after the specified line
- `newLineAtEnd`: boolean, optional: true if the file should have a newline at the end. Defaults to true.
- `sudo`: boolean, optional: true if sudo should be used when writing the file. Defaults to false.
- `mode`: string, optional: file permissions to set, e.g. `'775'`
- `owner`: string, optional: file owner to set
- `group`: string, optional: file group to set

```js
const {lineInFile} = require('@jcoreio/script-tools')

await lineInFile({
  file: '/etc/myPackage.conf',
  line: 'maxWorkers = 2',
  replace: 'maxWorkers', 
  sudo: true,
  owner: 'root',
  group: 'root',
})
```

####`spawn`

Promisified version of `child_process.spawn` that also prints the command being called and
pipes stdio to the parent process by default

Arguments:
- `command`: string, required: command to run
- `arguments`: Array<string>, optional: arguments
- `options`: Object, optional:
  - `sudo`: boolean, optional: true if the ssh command should be run with sudo. Defaults to false.
  - `prefix`: string, optional: optional prefix to prepend to each line of stderr / stdout from the child process
  - `captureStdio`: boolean, optional: true if the process's stdio should be captured for later use as well as being piped through to the parent process. Defaults to false.
  
```js
const {spawn} = require('@jcoreio/script-tools')

await spawn('git', ['clone', 'https://github.com/myorg/myrepo'], {
  captureStdio: true
})
```

####`writeFile`

Writes a file if its contents do not already match, and optionally sets the file's permissions

Arguments:
- `file`: string, required: file path to write
- `contents`: string, required: file contents to write
- `options`: Object, optional:
  - `sudo`: boolean, optional: true if sudo should be used when writing the file. Defaults to false.
  - `mode`: string, optional: file permissions to set, e.g. `'775'`
  - `owner`: string, optional: file owner to set
  - `group`: string, optional: file group to set

```js
const {writeFile} = require('@jcoreio/script-tools')

await writeFile('.gitignore', 'node_modules', {mode: '775', owner: 'root', group: 'root'})
```

## `ProcessHandler` class

Ensures that child processes are terminated when the parent process exits

Constructor options:
- `maxProcesses`: number, optional: the maximum number of simultaneous running processes. Defaults to 100. If this 
limit is exceeded, an Error will be thrown when the next process is added.

```js
const {ProcessHandler} = require('@jcoreio/script-tools')

const handler = new ProcessHandler({maxProcesses: 10})

await handler.exec('docker kill my-container')

await handler.spawn('git', ['pull'])

await handler.execRemote({
  host: 'myhost.mycompany.com',
  command: 'uptime'
})

const child = require('child_process').spawn('ls', ['-l'])
handler.killOnExit(child)

handler.killAll()
```

The following methods work the same as their standaline counterparts, and also return
a process that will be terminated when the parent process exits:

- `exec`
- `execRemote`
- `spawn`

#####`killOnExit`

Monitors an already-launched process and kills it when the parent process exits

Arguments:
- `process`: ChildProcess, required: process to kill when the parent process exits

#####`killAll`

Kills all processes that are being monitored. This action is run automatically when 
node is about to exit.

## License

 [Apache-2.0](LICENSE)
