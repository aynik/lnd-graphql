process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

const fs = require('fs')
const path = require('path')
const grpcLib = require('grpc')
const protoLoader = require('@grpc/proto-loader')

const { Metadata, loadPackageDefinition } = grpcLib
const {
  createFromMetadataGenerator,
  combineChannelCredentials,
  createSsl
} = grpcLib.credentials

const protoFilename = path.resolve(__dirname, 'proto/ln-rpc.proto')

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
      const metadata = new Metadata()
      const macaroonHex = fs.readFileSync(lndMacaroonPath).toString("hex")
      metadata.add('macaroon', macaroonHex)
      const macaroonCreds = createFromMetadataGenerator((_, done) => {
        done(null, metadata)
      })
      const lndCert = fs.readFileSync(lndCertPath)
      const sslCreds = createSsl(lndCert)
      const credentials = combineChannelCredentials(sslCreds, macaroonCreds)
      const protoLoaderOpts = {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      }
      protoLoader.load(protoFilename, protoLoaderOpts).then((packageDefinition) => {
        const { lnrpc } = loadPackageDefinition(packageDefinition)
        const connection = new lnrpc.Lightning(lndAddress, credentials)
        grpcLib.waitForClientReady(connection, Infinity, (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve(connection)
        })
      }).catch(reject)
    })
  }
}
