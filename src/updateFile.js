// @flow

import assert from 'assert'
import fs from 'fs-extra'

import {exec} from 'promisify-child-process'

import {spawn} from './spawn'

import randomstring from 'randomstring'

const tempFilePath = () => `/tmp/${randomstring.generate(16)}`

export type OwnershipOpts = {
  owner?: string,
  group?: string,
  mode?: string,
}

export type LineInFileOpts = {
  file: string,
  line: string,
  replace?: string,
  insertAfter?: string,
  newLineAtEnd?: boolean,
  sudo?: boolean,
} & OwnershipOpts

/**
 * @param opts
 * @returns {boolean} true if the file was changed, false otherwise
 */
export async function lineInFile(opts: LineInFileOpts): Promise<boolean> {
  const {file, sudo, owner, group, mode} = opts
  assert(file, 'file is required')
  const lines = await fs.pathExists(file) ? (await fs.readFile(file, 'utf8')).split('\n') : []
  if (lines.includes(opts.line)) return false
  let writeIdx = lines.length
  let found = false
  const searchString = opts.replace || opts.insertAfter
  if (searchString) {
    const existIdx = lines.findIndex(line => line.startsWith(searchString))
    found = existIdx >= 0
    writeIdx = found ? (opts.insertAfter ? existIdx + 1 : existIdx) : lines.length
  }
  const deleteCount = (found && opts.replace) ? 1 : 0
  lines.splice(writeIdx, deleteCount, opts.line)
  const newLineAtEnd = opts.newLineAtEnd == null ? true : !!opts.newLineAtEnd
  const newFileContent = lines.join('\n') + (newLineAtEnd ? '\n' : '')
  await writeFile(file, newFileContent, { sudo, owner, group, mode })
  return true
}

export type WriteFileOpts = {
  sudo?: boolean,
} & OwnershipOpts

export async function writeFile(file: string, fileContents: string, opts: WriteFileOpts = {}): Promise<boolean> {
  let matches = false
  const {sudo, owner, group, mode} = opts
  if (sudo) {
    if (await fs.pathExists(file)) {
      const readPath = tempFilePath()
      // Make a copy and ensure we have permission to read it, since the target file may
      // require root permissions to read
      await spawn('cp', [file, readPath], {sudo})
      // $FlowFixMe: ok to await result of exec
      const username = (await exec('whoami')).stdout.trim()
      if (username) {
        await applyOwnershipAndPermissions({path: readPath, owner: username, mode: '400', sudo})
      }
      matches = await fs.readFile(readPath, 'utf8') === fileContents
      await fs.remove(readPath)
    }
    if (!matches) {
      const writePath = tempFilePath()
      fs.writeFileSync(writePath, fileContents)
      await spawn('mv', [writePath, file], {sudo})
    }
  } else {
    matches = await fs.pathExists(file) && (await fs.readFile(file, 'utf8')) === fileContents
    await fs.writeFile(file, fileContents)
  }
  await applyOwnershipAndPermissions({
    path: file,
    sudo,
    owner,
    group,
    mode: mode || '644',
  })
  return !matches
}

async function applyOwnershipAndPermissions(args: {
  path: string,
  sudo?: boolean,
} & OwnershipOpts): Promise<void> {
  const {path, sudo, owner, group, mode} = args
  if (owner)
    await spawn('chown', [owner, path], {sudo})
  if (group)
    await spawn('chgrp', [group, path], {sudo})
  if (mode)
    await spawn('chmod', [mode, path], {sudo})
}

