// @flow

import {spawn} from './spawn'

// The -t -t option causes the remote process to be killed when this process is killed: https://unix.stackexchange.com/questions/103699/kill-process-spawned-by-ssh-when-ssh-dies
export const execRemote = ({host, user, keyFile, command, strictHostKeyChecking, spawnOpts}: {
  host: string,
  user?: ?string,
  keyFile?: ?string,
  command: string,
  strictHostKeyChecking?: ?boolean,
  spawnOpts?: ?Object,
}) => spawn('ssh', ['-t', '-t',
  ...(strictHostKeyChecking ? [] : ['-o', 'StrictHostKeyChecking=no']),
  ...(user ? ['-l', user] : []),
  ...(keyFile ? ['-i', keyFile] : []),
  host, command], spawnOpts || {})
