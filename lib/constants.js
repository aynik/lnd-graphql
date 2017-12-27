const os = require('os')
const path = require('path')

const homedir = os.homedir()

let LND_DEFAULT_CERT_PATH
let LND_DEFAULT_MACAROON_PATH

switch (os.platform()) {
  case 'darwin':
    LND_DEFAULT_CERT_PATH = path.join(homedir, 'Library/Application\ Support/Lnd/tls.cert')
    LND_DEFAULT_MACAROON_PATH = path.join(homedir, 'Library/Application\ Support/Lnd/admin.macaroon')
    break
  case 'linux':
    LND_DEFAULT_CERT_PATH = path.join(homedir, '.lnd/tls.cert')
    LND_DEFAULT_MACAROON_PATH = path.join(homedir, '.lnd/admin.macaroon')
    break
  case 'win32':
    LND_DEFAULT_CERT_PATH = path.join(homedir, 'AppData', 'Local', 'Lnd', 'tls.cert')
    LND_DEFAULT_MACAROON_PATH = path.join(homedir, 'AppData', 'Local', 'Lnd', 'admin.macaroon')
    break
  default:
    throw new Error('OS not supported')
}

const LND_DEFAULT_ADDRESS = 'localhost:10009'

module.exports = {
  LND_DEFAULT_CERT_PATH,
  LND_DEFAULT_MACAROON_PATH,
  LND_DEFAULT_ADDRESS
}
