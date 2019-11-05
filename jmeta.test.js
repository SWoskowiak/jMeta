/* eslint-env mocha */
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const JMeta = require('./jmeta')
const _ = require('lodash')

chai.use(dirtyChai)
chai.config.includeStack = true
const expect = chai.expect

describe('jMeta', () => {
  let baseExample
  beforeEach(async () => {
    baseExample = {
      one: {
        a: { },
        b: { },
        c: { },
        d: [
          { thingOne: true },
          { thingTwo: true },
          { thingThree: false },
          [ [ [ { nestedDeep: 321 } ] ] ]
        ]
      },
      two: {
        a: {
          c: '',
          d: {
            e: { },
            f: [
              { thingOne: [ { hiddenDeep: 123 }, 'ignored' ] }
            ]
          }
        }
      },
      three: {
        a: 'hello',
        f: 'world'
      }
    }
  })

  describe('constructor', () => {
    context('when a complex valid JSON object is passed in', () => {
      let jmeta
      beforeEach(() => {
        jmeta = new JMeta(baseExample)
      })

      it('processes out the object as expected and handles some tricky nesting', () => {
        let entries = []
        // Map.keys() is an iterable so convert it to an array
        for (let entry of jmeta._map.entries()) entries.push(entry)

        // Check that all the entries line up to expectations
        // Keys should also be in depth first traversal order
        expect(entries).to.deep.equal([
          ['one', [
            { depth: 1, path: 'one' }
          ]],
          ['a', [
            { depth: 2, path: 'one.a' },
            { depth: 2, path: 'two.a' },
            { depth: 2, path: 'three.a' }
          ]],
          ['b', [
            { depth: 2, path: 'one.b' }
          ]],
          ['c', [
            { depth: 2, path: 'one.c' },
            { depth: 3, path: 'two.a.c' }
          ]],
          ['d', [
            { depth: 2, path: 'one.d' },
            { depth: 3, path: 'two.a.d' }
          ]],
          ['thingOne', [
            { depth: 4, path: 'one.d[0].thingOne' },
            { depth: 6, path: 'two.a.d.f[0].thingOne' }
          ]],
          ['thingTwo', [
            { depth: 4, path: 'one.d[1].thingTwo' }
          ]],
          ['thingThree', [
            { depth: 4, path: 'one.d[2].thingThree' }
          ]],
          ['nestedDeep', [
            { depth: 7, path: 'one.d[3][0][0][0].nestedDeep' }
          ]],
          ['two', [
            { depth: 1, path: 'two' }
          ]],
          ['e', [
            { depth: 4, path: 'two.a.d.e' }
          ]],
          ['f', [
            { depth: 4, path: 'two.a.d.f' },
            { depth: 2, path: 'three.f' }
          ]],
          ['hiddenDeep', [
            { depth: 8, path: 'two.a.d.f[0].thingOne[0].hiddenDeep' }
          ]],
          ['three', [
            { depth: 1, path: 'three' }
          ]]
        ])

        let [ { path } ] = jmeta.map.get('hiddenDeep')
        // Ensure paths generated line up with lodash get syntax
        expect(_.get(baseExample, path)).to.equal(123)
      })
    })

    context('when the parse target is an array (and also contains arrays)', () => {
      let jmeta, data
      beforeEach(() => {
        data = [
          [ { x: 'foo' }, { y: 'bar' } ],
          [ { x: 'baz' }, { z: 'buz' } ],
          {
            baz: 123
          }
        ]
        jmeta = new JMeta(data)
      })

      it('still processes it properly', () => {
        let keys = []
        // Map.keys() is an iterable so convert it to an array
        for (let entry of jmeta._map.entries()) keys.push(entry)

        expect(keys).to.deep.equal([
          [ 'x', [
            { depth: 3, path: '[0][0].x' },
            { depth: 3, path: '[1][0].x' }
          ]],
          [ 'y', [
            { depth: 3, path: '[0][1].y' }
          ]],
          [ 'z', [
            { depth: 3, path: '[1][1].z' }
          ]],
          [ 'baz', [
            { depth: 2, path: '[2].baz' }
          ]]
        ])
      })
    })

    context('when the object to parse is not a valid object', () => {
      let err, res
      try {
        res = new JMeta(1)
      } catch (e) {
        err = e
      }

      expect(res).to.be.undefined()
      expect(err).to.not.be.undefined()
      expect(err.message).to.contain('Must pass a valid JS object')

      err = undefined
      res = undefined
      try {
        res = new JMeta('123')
      } catch (e) {
        err = e
      }

      err = undefined
      res = undefined
      try {
        res = new JMeta(false)
      } catch (e) {
        err = e
      }

      expect(res).to.be.undefined()
      expect(err).to.not.be.undefined()
      expect(err.message).to.contain('Must pass a valid JS object')
    })
  })

  describe('paths', () => {
    let jmeta
    beforeEach(() => {
      jmeta = new JMeta(baseExample)
    })
    context('when a complex valid JSON object is passed in', () => {
      it('returns all paths as expected', () => {
        // Sort results for simplicity of checking
        let paths = jmeta.paths().sort()
        expect(paths).to.deep.equal([
          'one',
          'one.a',
          'one.b',
          'one.c',
          'one.d',
          'one.d[0].thingOne',
          'one.d[1].thingTwo',
          'one.d[2].thingThree',
          'one.d[3][0][0][0].nestedDeep',
          'three',
          'three.a',
          'three.f',
          'two',
          'two.a',
          'two.a.c',
          'two.a.d',
          'two.a.d.e',
          'two.a.d.f',
          'two.a.d.f[0].thingOne',
          'two.a.d.f[0].thingOne[0].hiddenDeep'
        ])
      })
    })

    context('when a key filter is supplied', () => {
      it('returns matching key results accordingly', () => {
        expect(jmeta.paths({ key: 'thingOne' })).to.deep.equal([
          'one.d[0].thingOne',
          'two.a.d.f[0].thingOne'
        ])

        expect(jmeta.paths({ key: 'hiddenDeep' })).to.deep.equal([
          'two.a.d.f[0].thingOne[0].hiddenDeep'
        ])

        // Ensure the path is compatible with lodash's _.get
        let [ path ] = jmeta.paths({ key: 'hiddenDeep' })
        expect(_.get(baseExample, path)).to.equal(123)
      })
    })

    context('when an unknown key is supplied', () => {
      it('returns an empty result', () => {
        expect(jmeta.paths({ key: 'halflife3' })).to.deep.equal([])
      })
    })

    context('when an invalid key is supplied', () => {
      it('throws an error', () => {
        let err
        try {
          jmeta.paths({ key: NaN })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"key" must be a string')

        err = undefined
        try {
          jmeta.paths({ key: 123 })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"key" must be a string')

        err = undefined
        try {
          jmeta.paths({ key: {} })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"key" must be a string')
      })
    })

    context('when a depth filter is supplied', () => {
      it('returns paths only at the given depth', () => {
        let paths = jmeta.paths({ depth: 1 })
        expect(paths).to.deep.equal([
          'one',
          'two',
          'three'
        ])

        paths = jmeta.paths({ depth: 2 })
        expect(paths).to.deep.equal([
          'one.a',
          'two.a',
          'three.a',
          'one.b',
          'one.c',
          'one.d',
          'three.f'
        ])

        paths = jmeta.paths({ depth: 3 })
        expect(paths).to.deep.equal([
          'two.a.c',
          'two.a.d'
        ])

        paths = jmeta.paths({ depth: 4 })
        expect(paths).to.deep.equal([
          'one.d[0].thingOne',
          'one.d[1].thingTwo',
          'one.d[2].thingThree',
          'two.a.d.e',
          'two.a.d.f'
        ])

        paths = jmeta.paths({ depth: 5 })
        expect(paths).to.deep.equal([])

        paths = jmeta.paths({ depth: 6 })
        expect(paths).to.deep.equal([ 'two.a.d.f[0].thingOne' ])

        paths = jmeta.paths({ depth: 7 })
        expect(paths).to.deep.equal([ 'one.d[3][0][0][0].nestedDeep' ])

        paths = jmeta.paths({ depth: 8 })
        expect(paths).to.deep.equal([ 'two.a.d.f[0].thingOne[0].hiddenDeep' ])
      })
    })

    context('when an invalid depth is supplied', () => {
      it('throws an error', () => {
        let err
        try {
          jmeta.paths({ depth: NaN })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"depth" must be a number')

        err = undefined
        try {
          jmeta.paths({ depth: '123' })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"depth" must be a number')

        err = undefined
        try {
          jmeta.paths({ depth: {} })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"depth" must be a number')
      })
    })

    context('when a path includes filter is supplied', () => {
      it('returns paths who include the provided string in them (case sensitive)', () => {
        let paths = jmeta.paths({ includes: 'one' })
        expect(paths).to.deep.equal([
          'one',
          'one.a',
          'one.b',
          'one.c',
          'one.d',
          'one.d[0].thingOne',
          'one.d[1].thingTwo',
          'one.d[2].thingThree',
          'one.d[3][0][0][0].nestedDeep'
        ])

        paths = jmeta.paths({ includes: 'One' })
        expect(paths).to.deep.equal([
          'one.d[0].thingOne',
          'two.a.d.f[0].thingOne',
          'two.a.d.f[0].thingOne[0].hiddenDeep'
        ])

        paths = jmeta.paths({ includes: 'Deep' })
        expect(paths).to.deep.equal([
          'one.d[3][0][0][0].nestedDeep',
          'two.a.d.f[0].thingOne[0].hiddenDeep'
        ])

        paths = jmeta.paths({ includes: 'd[0]' })
        expect(paths).to.deep.equal([ 'one.d[0].thingOne' ])
      })
    })

    context('when an invalid includes filter is supplied', () => {
      it('throws an error', () => {
        let err
        try {
          jmeta.paths({ includes: NaN })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"includes" must be a non-empty string')

        err = undefined
        try {
          jmeta.paths({ includes: 123 })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"includes" must be a non-empty string')

        err = undefined
        try {
          jmeta.paths({ includes: {} })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"includes" must be a non-empty string')

        err = undefined
        try {
          jmeta.paths({ includes: '' })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"includes" must be a non-empty string')
      })
    })
  })

  describe('keys', () => {
    let jmeta
    beforeEach(() => {
      jmeta = new JMeta(baseExample)
    })

    it('returns the given keys of an object', () => {
      let keys = jmeta.keys()
      expect(keys).to.deep.equal([
        'one',
        'a',
        'b',
        'c',
        'd',
        'thingOne',
        'thingTwo',
        'thingThree',
        'nestedDeep',
        'two',
        'e',
        'f',
        'hiddenDeep',
        'three'
      ])
    })

    context('when there is a depth specified', () => {
      it('returns the keys at the given depth', () => {
        let keys = jmeta.keys({ depth: 1 })
        expect(keys).to.deep.equal([
          'one',
          'two',
          'three'
        ])

        keys = jmeta.keys({ depth: 2 })
        expect(keys).to.deep.equal([
          'a',
          'b',
          'c',
          'd',
          'f'
        ])

        keys = jmeta.keys({ depth: 3 })
        expect(keys).to.deep.equal([
          'c',
          'd'
        ])

        keys = jmeta.keys({ depth: 4 })
        expect(keys).to.deep.equal([
          'thingOne',
          'thingTwo',
          'thingThree',
          'e',
          'f'
        ])

        keys = jmeta.keys({ depth: 6 })
        expect(keys).to.deep.equal([
          'thingOne'
        ])

        keys = jmeta.keys({ depth: 7 })
        expect(keys).to.deep.equal([
          'nestedDeep'
        ])

        keys = jmeta.keys({ depth: 8 })
        expect(keys).to.deep.equal([
          'hiddenDeep'
        ])
      })
    })

    context('when the depth specified is not a valid number', () => {
      it('throws and error', () => {
        let err
        try {
          jmeta.keys({ depth: NaN })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"depth" must be a number')

        err = undefined
        try {
          jmeta.keys({ depth: '123' })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"depth" must be a number')

        err = undefined
        try {
          jmeta.keys({ depth: {} })
        } catch (e) {
          err = e
        }
        expect(err).to.not.be.undefined()
        expect(err.message).to.contain('"depth" must be a number')
      })
    })
  })

  describe('size', () => {
    context('when there are no duplicate properties', () => {
      let jmap
      beforeEach(() => {
        jmap = new JMeta({
          a: {},
          b: { c: {} },
          d: { e: { f: { } } }
        })
      })

      it('returns the size', () => {
        expect(jmap.size).to.equal(6)
      })
    })

    context('when there are duplicate properties that are trickier to count', () => {
      let jmap
      beforeEach(() => {
        jmap = new JMeta({
          a: { a: [ { a: 1 } ] },
          b: { c: { c: 2 } },
          d: { e: { f: [ { f: 2 } ] } }
        })
      })

      it('returns the accurate size', () => {
        expect(jmap.size).to.equal(10)
      })
    })
  })
})
