import config from '../config/config'
import { encrypt, decrypt } from '../server/helpers/crypto';

const action = process.argv[2]
const privateKey = process.argv[3]
const secretKey = process.argv[4] ? process.argv[4] : config.secretKey

if (action == 'decrypt') {
  console.log(decrypt(privateKey, secretKey))
} else {
  console.log(encrypt(privateKey, secretKey))
}
