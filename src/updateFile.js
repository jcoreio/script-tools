// @flow

import assert from 'assert'
import fs from 'fs-extra'

import {spawn} from './spawn'

import randomstring from 'randomstring'

export type LineInFileOpts = {
  file: string,
  line: string,
  replace?: string,
  insertAfter?: string,
  newLineAtEnd?: boolean,
  sudo?: boolean,
  mode?: string,
}

/**
 * @param opts
 * @returns {boolean} true if the file was changed, false otherwise
 */
export async function lineInFile(opts: LineInFileOpts): Promise<boolean> {
  assert(opts.file, 'file is required')
  const lines = await fs.pathExists(opts.file) ? (await fs.readFile(opts.file, 'utf8')).split('\n') : []
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
  await writeFile(opts.file, newFileContent, { sudo: opts.sudo, mode: opts.mode })
  return true
}

export type WriteFileOpts = {
  sudo?: boolean,
  mode?: string,
}

export async function writeFile(file: string, fileContents: string, opts: WriteFileOpts = {}): Promise<boolean> {
  const matches = await fs.pathExists(file) && (await fs.readFile(file, 'utf8')) === fileContents
  const {sudo} = opts
  if (!matches) {
    if (sudo) {
      const writePath = `/tmp/${randomstring.generate(16)}`
      fs.writeFileSync(writePath, fileContents)
      await spawn('mv', [writePath, file], {sudo})
    } else {
      await fs.writeFile(file, fileContents)
    }
  }
  await spawn('chmod', [opts.mode || '644', file], {sudo})
  return !matches
}
