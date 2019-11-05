[![Build Status](https://travis-ci.com/SWoskowiak/jMeta.svg?branch=master)](https://travis-ci.com/SWoskowiak/jMeta)
[![Coverage Status](https://coveralls.io/repos/github/SWoskowiak/jMeta/badge.svg?branch=master)](https://coveralls.io/github/SWoskowiak/jMeta?branch=master)

# jMeta
A JSON mapping utility to help generate meta data of a JSON object. Maps depth and paths to found keys.

Generated paths are compatible with Lodash's `_.get` and `_.set` to help manipulate deep data sets.

The generated data is in an accessible `Map` object which you can run generator functions over as necessary or use the built in keys() and paths() to retrieve information in a more familiar way.

## Install

`npm install jmeta` or `yarn add jmeta`

## Basic Usage 
```javascript
  const JMeta = require('jmeta')
  const _ = require('lodash')
  
  const data = {
    a: {
      b: {
        c: [
          [ { d: true }, 'ignored', { a: 'duplicate' } ]
        ]
      }
    }
  }
  const jmeta = new JMeta(data)
  
  console.log(jmeta.paths())     // Outputs: [ 'a', 'a.b.c[0][2].a', 'a.b', 'a.b.c', 'a.b.c[0][0].d' ]
  console.log(jmeta.keys())      // Outputs: [ 'a', 'b', 'c', 'd' ] NOTE: Unique keys
  console.log(jmeta.size)        // Outputs: 5 (NOTE: Accounts for duplicate found keys)
  console.log(jmeta.duplicates)  // Outputs: [ 'a' ]
  
  let foo = _.get(data, jmeta.paths()[1]) // 'a.b.c[0][2].a'
  console.log(foo)                        // Outputs: 'duplicate'
  
  // Access the map object directly
  console.log(jmeta.map.get('a')) // Outputs: [ { depth: 1, path: 'a' }, { depth: 6, path: 'a.b.c[0][2].a' } ]
  
```

## Paths()
Takes an options object as its only parameter to specify some basic filtering
The options object supports the following filters: `{ depth: <number>, includes: <string>, key: <string> }`
Filtering options can be combined in any way to reduce results accordingly

NOTE: Will always return an array, on no results found the results will simply be `[]`
#### Filtering Paths
```javascript
  const JMeta = require('jmeta')
  const _ = require('lodash')
  
  const data = {
    location: {
      france: [ { name: 'Tom' }, { name: 'Mary' } ],
      italy: [ { name: 'Mike' } ]
    }
  }
  const jmeta = new JMeta(data)

  // DEPTH FILTERING
  console.log(jmeta.paths({ depth: 2 })) // Outputs: ['location.france', 'location.italy']
  console.log(jmeta.paths({ depth: 4 })) // Outputs: ['location.france[0].name', 'location.france[1].name', 'location.italy[0].name']

  // PATH INCLUDES FILTERING
  console.log(jmeta.paths({ includes: 'france' }))    // Outputs: ['location.france', 'location.france[0].name', 'location.france[1].name']
  console.log(jmeta.paths({ includes: 'france[0]' })) // Outputs: ['location.france[0].name']

  // KEY FILTERING
  console.log(jmeta.paths({ key: 'france' })) // Outputs: ['location.france']
  console.log(jmeta.paths({ key: 'name' })  // Outputs: ['location.france[0].name', 'location.france[1].name', 'location.italy[0].name']
  
```
## Keys()
```javascript
  const JMeta = require('jmeta')
  const _ = require('lodash')
  
  const data = {
    location: {
      france: [ { person: 'Tom' }, { person: 'Mary' } ],
      italy: [ { person: 'Mike' } ]
    }
  }
  const jmeta = new JMeta(data)
  
  console.log(jmeta.keys())                // Outputs: [ 'location', 'france', 'person', 'italy' ] NOTE: Returns unique found keys only
  console.log(jmeta.paths({ depth: 2 }))   // Outputs: [ 'france', 'italy' ]
  console.log(jmeta.paths({ depth: 4 }))   // Outputs: [ 'person' ]
  
```
