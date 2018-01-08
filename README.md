# lnd-graphql [![npm version](https://badge.fury.io/js/lnd-graphql.svg)](https://badge.fury.io/js/lnd-graphql)

### Graphql gateway for lnd ⚡️

---

### Installation

```shell
$ npm install --save lnd-graphql
```

---

### Usage

```js
const { getGraphQLConfig } = require('lnd-graphql')

getGraphQLConfig({
  lndCertPath,      // Default: darwin -> ~/Library/Application\ Support/Lnd/tls.cert 
                    //          linux -> ~/.lnd/tls.cert
                    //          win32 -> %HOMEPATH%\AppData\Local\Lnd\tls.cert

  lndMacaroonPath,  // Default: darwin -> ~/Library/Application\ Support/Lnd/admin.macaroon
                    //          linux -> ~/.lnd/admin.macaroon
                    //          win32 -> %HOMEPATH%\AppData\Local\Lnd\admin.macaroon

  lndAddress        // Default: localhost:10009  
}).then((config) => {
  // use config somewhere
})
```

---

### Examples

- [Using `apollo-server-express`](https://github.com/aynik/lnd-graphql/tree/master/examples/express-graphql)

---

Donations: 3GHUWZ47MS3Yuyr7g8M3NwtmK2TAKhNVAh (BTC)
