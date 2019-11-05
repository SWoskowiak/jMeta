// Take in a JSON object and parse it into a tree structure
let _ = require('lodash')

// Our walker function, this will visit every "node" in a JSON object
// It keeps track of its depth and running path and passes it to the supplied callback func
function walkJSON (obj, func) {
  const traverse = (obj, curDepth, path, key) => {
    if (curDepth && key) func.apply(this, [key, curDepth, path])
    if (!obj) return // Bail on falsey obj ref
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
        } else {
          let newPath = path.length ? `${path}.${key}` : key
          func.apply(this, [key, curDepth + 1, newPath])
        }
      })
    }
  }
  return traverse(obj, 0, '')
}

/** Class JMETA - meta data mapping utility */
class JMETA {
  /**
     * Create a new jmeta instance.
     * @param {object} obj - The object to parse meta data out of
  */
  constructor (obj) {
    if (!_.isObject(obj)) throw new Error('Must pass a valid JS object')
    // Define internals to build upon as we walk through a JSON object
    this._map = new Map()
    this._duplicates = []
    // Begin traversal of this object (depth first)
    walkJSON.call(this, obj, this._add)
  }

  // Getters
  /**
   * Return the Map generated from the parsed object
   * @type {Map}
  */
  get map () { return this._map }
  /**
   * Return all found duplicate entry keys
   * @type {array}
  */
  get duplicates () { return this._duplicates }
  /**
   * Return total number of entries found (including duplicates)
   * @type {number}
  */
  get size () { return this._map.size + this._duplicates.length }

  /**
 * Get an array of unique found keys for the parsed object.
 * @param {object} options - Options to filter keys on.
 * @param {number} options.depth - Only return keys at a given depth.
 */
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

  /**
 * Get an array of all paths found for the parsed object.
 * @param {object} options - Options to filter paths on.
 * @param {number} options.depth - Only return paths at a given depth.
 * @param {string} options.key - Only return paths for a given known key.
 * @param {string} options.includes - Only return paths that include this string (case-sensitive).
 */
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
