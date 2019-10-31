// Take in a JSON object and parse it into a tree structure
let _ = require('lodash')

// Our walker function, this will visit every "node" in a JSON object
// It keeps track of its depth and running path and passes it to the supplied callback func
function walkJSON (obj, func) {
  const traverse = (obj, curDepth, path, key) => {
    if (curDepth && key) func.apply(this, [key, curDepth, path])
    // If this entry is an array then loop over its contents
    if (_.isArray(obj)) {
      obj.forEach((val, index) => {
        if (_.isObject(val) || _.isArray(val)) {
          let newPath = path.length ? `${path}[${index}]` : `[${index}]`
          traverse(val, curDepth + 1, newPath)
        }
      })
    // If this entry is an object then loop over its keys
    } else if (_.isObject(obj)) {
      Object.keys(obj).forEach(key => {
        if (obj[key] !== null) {
          let newPath = path.length ? `${path}.${key}` : key
          traverse(obj[key], curDepth + 1, newPath, key)
        }
      })
    }
  }
  return traverse(obj, 0, '')
}

// JSON meta data mapping utility
// Recursively walk a JSON tree ( Depth First ) and map out properties to allow for arbitrary value fetching by key and depth fetching.
class JMETA {
  constructor (obj, config = { uniqueOnly: false }) {
    if (!_.isObject(obj)) throw new Error('Must pass a valid JS object')

    // Allow unique keys only, throws error on parsing duplicate key
    this.uniqueOnly = config.uniqueOnly
    this._map = new Map()

    this._duplicates = []
    // Begin traversal of this object (depth first)
    walkJSON.call(this, obj, this._add)
  }

  // Getters
  get map () { return this._map }
  get duplicates () { return this._duplicates }
  get size () { return this._map.size + this._duplicates.length }

  keys ({ depth } = {}) {
    if ((depth !== undefined) && (!_.isNumber(depth) || isNaN(depth))) throw new Error('"depth" must be a number')
    let results = []

    for (let key of this._map.keys()) {
      if (depth) {
        if (this._map.get(key).filter(v => v.depth === depth).length) results.push(key)
      } else {
        results.push(key)
      }
    }
    return results
  }

  paths ({ key, depth, includes } = {}) {
    if ((key !== undefined) && !_.isString(key)) throw new Error('"key" must be a string')
    if ((depth !== undefined) && (!_.isNumber(depth) || isNaN(depth))) throw new Error('"depth" must be a number')
    if ((includes !== undefined) && (!_.isString(includes) || includes === '')) throw new Error('"includes" must be a non-empty string')

    let result = []
    if (key) {
      let values = this._map.get(key)
      if (!values) return [] // No result found
      let filtered = values.filter(v => {
        let pass = true
        if (depth) pass = (v.depth === depth)
        if (includes && pass) pass = (v.path.includes(includes))
        return pass
      })
      if (filtered.length) result.push(filtered.map(f => f.path))
    } else {
      for (let [ , values ] of this._map.entries()) {
        if (depth || includes) {
          let filtered = values.filter(v => {
            let pass = true
            if (depth) pass = (v.depth === depth)
            if (includes && pass) pass = (v.path.includes(includes))
            return pass
          })
          if (filtered.length) result.push(filtered.map(f => f.path))
        } else {
          result.push(values.map(v => v.path))
        }
      }
    }

    return _.flatten(result)
  }

  // Add key into the map
  _add (key, depth, path) {
    let existing = this._map.get(key)

    // This key has already been set in our map
    if (existing) {
      // If we are configured for unique only be sure to error out on duplicates
      if (this.uniqueOnly) throw new Error(`JMAP: Cannot set ${key}, as it already exists (uniqueOnly)`)
      // Push new data into place at the existing key
      existing.push({ depth, path })
      this._map.set(key, existing)
      // Ensure our .size is accurate to these nested properties by tracking duplicates
      this._duplicates.push(key)
    } else {
      this._map.set(key, [ { depth, path } ])
    }
  }
}

module.exports = JMETA
