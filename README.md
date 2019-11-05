[![Build Status](https://travis-ci.com/SWoskowiak/jMeta.svg?branch=master)](https://travis-ci.com/SWoskowiak/jMeta)
[![Coverage Status](https://coveralls.io/repos/github/SWoskowiak/jMeta/badge.svg?branch=master)](https://coveralls.io/github/SWoskowiak/jMeta?branch=master)

# jMeta
A JSON mapping utility to help generate meta data of a JSON object. 

Generates Lodash compatible `get` and `set` strings for each element to help manipulate deep data sets.

Builds out this meta data in an accessible `Map` object which you can run generator functions over as necessary or use the built in keys() and paths() to retrieve information.

## Install/Add

`npm install jmeta`

OR

`yarn add jmeta`

## Basic Usage
```
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
  
```
