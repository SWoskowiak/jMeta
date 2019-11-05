[![Build Status](https://travis-ci.com/SWoskowiak/jMeta.svg?branch=master)](https://travis-ci.com/SWoskowiak/jMeta)
[![Coverage Status](https://coveralls.io/repos/github/SWoskowiak/jMeta/badge.svg?branch=master)](https://coveralls.io/github/SWoskowiak/jMeta?branch=master)

# jMeta
A JSON mapping utility to help generate meta data of a JSON object. Maps depth and paths to found keys.

Generated paths are compatible with Lodash's `_.get` and `_.set` to help manipulate deep data sets.

The generated data is in an accessible `Map` object which you can run generator functions over as necessary or use the built in keys() and paths() to retrieve information in more familiar way.

## Install/Add

`npm install jmeta`

OR

`yarn add jmeta`

## Basic Usage
```javascript
  const JMeta = require('jmeta')
  const _ = require('lodash')
  
  const data = {
    a: { b: { c: [ [ { d: true }, 'ignored', { a: 'duplicate' } ] ] } }
  }
  const jmeta = new JMeta(data)
  
  console.log(jmeta.paths())     // Outputs: [ 'a', 'a.b.c[0][2].a', 'a.b', 'a.b.c', 'a.b.c[0][0].d' ]
  console.log(jmeta.keys())      // Outputs: [ 'a', 'b', 'c', 'd' ] NOTE: Unique keys
  console.log(jmeta.size)        // Outputs: 5                      NOTE: Accounts for duplicate found keys
  console.log(jmeta.duplicates)  // Outputs: [ 'a' ]
  
  let foo = _.get(data, jmeta.paths()[1]) // 'a.b.c[0][2].a'
  console.log(foo)                        // Outputs: 'duplicate'
  
```

### Paths()
Takes an options object as its only parameter to specify some basic filtering
The options object supports the following filters: `{ depth, includes, key }`
Filtering options can be combined in any way to reduce results accordingly

NOTE: Will always return an array, on no results found the results will simply be `[]`
#### Depth
```javascript
  const JMeta = require('jmeta')
  const _ = require('lodash')
  
  const data = {
    a: { b: { c: [ [ { d: true }, 'ignored', { a: 'duplicate' } ] ] } }
  }
  const jmeta = new JMeta(data)
  
  console.log(jmeta.paths())               // Outputs: [ 'a', 'a.b.c[0][2].a', 'a.b', 'a.b.c', 'a.b.c[0][0].d' ]
  console.log(jmeta.paths({ depth: 1 }))   // Outputs: [ 'a' ]
  console.log(jmeta.paths({ depth: 6 }))   // Outputs: [ 'a.b.c[0][2].a', 'a.b.c[0][0].d' ]   NOTE: Array depth is included in determining final depth value
  
```
