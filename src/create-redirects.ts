import { existsSync, readFile, writeFile } from 'fs-extra'

import { HEADER_COMMENT } from './constants'

const toPagesPath = (fromPath: string, toPath: string): Array<string> => {
  if (fromPath.match(/\?/)) {
    throw new Error(
      `[gatsby-plugin-cloudflare-pages] Query parameter redirects are not supported by Cloudflare Pages (fromPath: ${fromPath})`,
    )
  }

  // Modifies wildcard & splat redirects, having no effect on other toPath strings
  const pagesToPath = toPath.replace(/\*/, ':splat')

  return [fromPath, pagesToPath]
}

// eslint-disable-next-line max-statements
export default async function writeRedirectsFile(pluginData: any, redirects: any, rewrites: any) {
  const { publicFolder } = pluginData

  if (redirects.length === 0 && rewrites.length === 0) return null

  const FILE_PATH = publicFolder(`_redirects`)

  // Map redirect data to the format Cloudflare Pages expects
  // eslint-disable-next-line max-statements
  redirects = redirects
    .filter((r) => !r.redirectInBrowser)
    .map((redirect: any) => {
      const { fromPath, isPermanent, redirectInBrowser, force, toPath, statusCode, ...rest } = redirect

      let status = isPermanent ? `301` : `302`
      if (statusCode) status = String(statusCode)

      if (force) status = `${status}!`

      const [pagesFromPath, pagesToPath] = toPagesPath(fromPath, toPath)

      const pieces = [pagesFromPath, pagesToPath, status]

      return pieces.join(`  `)
    })

  rewrites = rewrites.map(({ fromPath, toPath }: any) => `${fromPath}  ${toPath}  200`)

  let commentFound = false

  // Websites may also have statically defined redirects
  // In that case we should append to them (not overwrite)
  // Make sure we aren't just looking at previous build results though
  const fileExists = existsSync(FILE_PATH)
  let fileContents = ``
  if (fileExists) {
    fileContents = await readFile(FILE_PATH, `utf8`)
    commentFound = fileContents.includes(HEADER_COMMENT)
  }
  let data
  if (commentFound) {
    const [theirs] = fileContents.split(`\n${HEADER_COMMENT}\n`)
    data = theirs
  } else {
    data = fileContents
  }

  return writeFile(FILE_PATH, [data, HEADER_COMMENT, ...redirects, ...rewrites].join(`\n`))
}
