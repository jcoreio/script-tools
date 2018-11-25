# JCore Script Tools

Helpers for common scripting tasks like modifying configuration files

## Installation

`npm install --save @jcoreio/script-tools`

or

`yarn add @jcoreio/script-tools`

## Usage

```js
const {lineInFile} = require('@jcoreio/script-tools')

await lineInFile({
  file: '/etc/myPackage.conf',
  line: 'maxWorkers = 2',
  replace: 'maxWorkers', 
  sudo: true,
})
```

## License

 [Apache-2.0](LICENSE)