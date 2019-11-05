[![Build Status](https://travis-ci.com/SWoskowiak/jMeta.svg?branch=master)](https://travis-ci.com/SWoskowiak/jMeta)
[![Coverage Status](https://coveralls.io/repos/github/SWoskowiak/jMeta/badge.svg?branch=master)](https://coveralls.io/github/SWoskowiak/jMeta?branch=master)

# jMeta
A JSON mapping utility to help generate meta data of a JSON object. 

Generates Lodash compatible `get` and `set` strings for each element to help manipulate deep data sets.

Builds out this meta data in an accessible `Map` object which you can run generator functions over as necessary or use the built in keys() and paths() to retrieve information.

## Usage
```
  const data = {
    a: { b: { c: [ [ { d: true } ] ] } }
  }
  const jmeta = new JMeta(data)
  
```
