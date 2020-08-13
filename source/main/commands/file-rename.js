/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        FileRename command
 * CVM-Role:        <none>
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     This command renames a file.
 *
 * END HEADER
 */

const path = require('path')
const ZettlrCommand = require('./zettlr-command')
const ignoreFile = require('../../common/util/ignore-file')
const sanitize = require('sanitize-filename')
const hash = require('../../common/util/hash')

class FileRename extends ZettlrCommand {
  constructor (app) {
    super(app, 'file-rename')
  }

  /**
   * Rename a directory
   * @param {String} evt The event name
   * @param  {Object} arg An object containing hash of containing and name of new dir.
   */
  async run (evt, arg) {
    // { 'hash': hash, 'name': val }

    // We need to prepare the name to be correct for
    // accurate checking whether or not the file
    // already exists
    arg.name = sanitize(arg.name, { replacement: '-' })
    // Make sure we got an extension.
    if (ignoreFile(arg.name)) arg.name += '.md'

    let file = this._app.findFile(arg.hash)
    if (!file) return global.log.error(`Could not find file ${arg.hash}`)

    // Test if we are about to override a file
    if (this._app.findFile(hash(path.join(file.dir, arg.name)))) {
      // Ask for override
      let result = await this._app.getWindow().askOverwriteFile(arg.name)
      if (result.response === 0) return // No override wanted
    }

    // askOverwriteFile
    await this._app.getFileSystem().runAction('rename-file', {
      'source': file,
      'info': { 'name': arg.name }
    })

    // And done. FSAL has already notified the app of a necessary update
    global.application.fileUpdate(file)
    return true
  }
}

module.exports = FileRename
