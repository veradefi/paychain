Requirements:
  - The app requires 
    1. a working mysql database
    2. redis for queue management 
    3. an ethereum node to process transactions.

Setup:
  - Run `npm install` to install all required node modules
  - Copy .env.example file to .env

Configuration:
  - ENV file should be configured before running application. Some important env variables are:

    - NODE_ENV:
      Should be set to `production` or `development`. If set to `development`, it will clear database when initialing app by `npm run initialize`.
    - SECRET_KEY:
      Used to encrypt/decrypt private keys for accounts
    - API_URL:
      Used in testcases. Can be set equal to current server url if testing local deployment
    - MYSQL_*:
      MySQL related config variables. Should be set prior to starting application
    - QUEUE_*:
      Redis related config variables. Should be set prior to starting application
    - PROVIDER_TYPE:
      Currently supports `testrpc` and `rinkeby`. Should be set according to the network used. Used in init script.
    - PROVIDER_URL:
      Url of ethereum node. Preferably should be a geth node
    - ENTROPY:
      A random string used to create new accounts in web3. Can be left as it is.
    - DEFAULT_ADDRESS:
      Very important. Used to process transactions. Should be owner of ChainPay contract. Only one address is supported at a time.
    - PRIVATE_KEY:
      Encrypted private key of the default address. May be removed later on. Used to sign transactions for default address
    - CHAINPAY_CONTRACT_ADDRESS:
      Address of ChainPay contract deployed on ethereum node. This is used to make transfers in bulk.
    - TOKEN_CONTRACT_ADDRESS:
      Address of token contract deployed on ethereum node. Used to update account balance.

Initialization:
  - To initialize database, run `npm run initialize`. Please make sure you have NODE_ENV=production in your env file otherwise all your database will be cleared.
  - This script updates default ChainPay address and creates accounts in database from server/json/defaults.json based on network type (rinkey or testrpc)


Relevant services:
  There are 3 main services.
  1. API Server
    This is the main nodejs server that handles all requests from the client side. It provides routes such as creating accounts, creating new transactions and getting status of a transaction etc. Each transaction is pushed into a redis queue and processed by queue manager.
    To start this service, run `npm start`

  2. Queue Manager
    This service processes transactions in redis queue using default account provided in .env. It also acts as nonce manager for that address and stores nonce in redis. It fetches 200 transactions from the redis queue and sends them to the Chainpay contract as a single transaction to be processed by contract.
    To start this service, run `npm run queue` 

  3. Cronjob
    This service handles receipts of the transactions from Chainpay contract. It runs every minute and checks all pending transactions for confirmation. If confirmed, it marks them as complete. It also runs another cronjob every minute to see if there are any transactions stuck in queue manager and re-activates them.
    To start this service, run `npm run cron`

     



