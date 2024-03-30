import { readFile } from 'fs-extra'

import createRedirects from '../create-redirects'

import { createPluginData } from './helpers'

jest.mock(`fs-extra`, () => {
  const actualFsExtra = jest.requireActual(`fs-extra`)
  return {
    ...actualFsExtra,
  }
})

const redirects = [
  {
    fromPath: '/foo',
    isPermanent: false,
    ignoreCase: true,
    redirectInBrowser: false,
    toPath: '/bar',
  },
  {
    fromPath: '/dogs/*',
    isPermanent: false,
    ignoreCase: true,
    redirectInBrowser: false,
    toPath: '/animals/*',
  },
  {
    fromPath: '/baz',
    isPermanent: true,
    ignoreCase: true,
    redirectInBrowser: false,
    toPath: '/qux',
  },
  {
    fromPath: '/a',
    isPermanent: false,
    ignoreCase: true,
    redirectInBrowser: true,
    toPath: '/b',
  },
]

describe(`create-redirects`, () => {
  let reporter: any

  beforeEach(() => {
    reporter = {
      info: jest.fn(),
      panic: jest.fn(),
    }
  })

  it(`writes file`, async () => {
    const pluginData = await createPluginData()

    await createRedirects(pluginData, redirects, [], reporter)

    const output = await readFile(pluginData.publicFolder(`_redirects`), `utf8`)
    expect(output).toMatchSnapshot()
    expect(reporter.panic).not.toHaveBeenCalled()
  })
})
