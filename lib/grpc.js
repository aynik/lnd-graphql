const fs = require('fs')
const path = require('path')
const grpc = require('grpc')

const {
  LND_DEFAULT_CERT_PATH,
  LND_DEFAULT_MACAROON_PATH,
  LND_DEFAULT_ADDRESS
} = require('./constants')

module.exports = {
  getConnection ({ 
    lndCertPath = LND_DEFAULT_CERT_PATH,
    lndMacaroonPath = LND_DEFAULT_MACAROON_PATH,
    lndAddress = LND_DEFAULT_ADDRESS
  }) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(lndCertPath)) {
        reject(new Error(`Lnd cert file not found on: ${lndCertPath}`))
        return
      }
      if (!fs.existsSync(lndMacaroonPath)) {
        reject(new Error(`Lnd macaroon file not found on: ${lndMacaroonPath}`))
        return
      }
      const lndCert = fs.readFileSync(lndCertPath) 
      const credentials = grpc.credentials.createSsl(lndCert)
      const { lnrpc } = grpc.load(path.join(__dirname, 'proto/ln-rpc.proto'))
      const connection = new lnrpc.Lightning(lndAddress, credentials)
      const metadata = new grpc.Metadata()
      const macaroonHex = fs.readFileSync(lndMacaroonPath).toString("hex")
      metadata.add('macaroon', macaroonHex)
      grpc.waitForClientReady(connection, Infinity, (err) => {
        if (err) {
          reject(err)
          return
        }
        connection.metadata = metadata
        resolve(connection)
      })
    })
  }
}
