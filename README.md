# chainpay
Documentation prepared for Ubuntu 16.04 LTS.

## prerequisite
as root 
  
  ### Install Git
      apt-get update
      apt-get upgrade
      apt-get install git
  ### Install Node (v 10.*)
    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    apt-get install -y nodejs
    apt-get install build-essential

  ### Install Mysql (Server version 5.7, client Ver 14.14)
    apt-get install mysql-client
    apt-get install mysql-server-5.7 
    mysql_secure_installation (to configure mysql for first time use)

  ### Install Redis (v 4.0, https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-redis-on-ubuntu-16-04)
    apt-get install build-essential tcl
    cd /tmp
    curl -O http://download.redis.io/redis-stable.tar.gz
    tar xzvf redis-stable.tar.gz
    cd redis-stable
    make
    make test
    make install
    mkdir /etc/redis
    cp /tmp/redis-stable/redis.conf /etc/redis
    vi /etc/redis/redis.conf
        - update supervised from "no" to "systemd"
        - update dir from "./" to "/var/lib/redis"
    vi /etc/systemd/system/redis.service
        - Paste this in redis.service file
           "[Unit]
            Description=Redis In-Memory Data Store
            After=network.target

            [Service]
            User=redis
            Group=redis
            ExecStart=/usr/local/bin/redis-server /etc/redis/redis.conf
            ExecStop=/usr/local/bin/redis-cli shutdown
            Restart=always

            [Install]
            WantedBy=multi-user.target"
      adduser --system --group --no-create-home redis
      mkdir /var/lib/redis
      chown redis:redis /var/lib/redis
      chmod 770 /var/lib/redis
      systemctl start redis
      
switch back to user


## Clone chainpay repo (/home/ubuntu/chainpay in this case)
    git clone https://github.com/arbach/chainpay.git

## Installing node modules
    - Install required node modules by executing command `sudo npm install` in root directory of the project
    - Copy .env.example file to .env
    - Install yarn (npm install -g yarn)    

## Setting up database
    - Before launching main application, please make sure you have a mysql database named `ethereum_api`. To do that, open your mysql terminal as root (`mysql -uroot -p`) and run command `create database ethereum_api`.

## Starting ethereum node
    - You should have an ethereum node configured to launch main app. For this guide, we will assume that you have setup a rinkeby node.

## Configuration (This guide assumes you are using rinkeby as ethereum node)
  ENV file should be configured before running application. Some important env variables are:

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
    - CONTRACT_ADDRESS:
      Address of ChainPay contract deployed on ethereum node. This is used to make transfers in bulk.
    - PAYMENT_ADDRESS:
      Address of token contract deployed on ethereum node. Used to update account balance.

## Before initialization:
### Please make sure you have updated .env file
     - contain correct mysql credentials
     - contain correct redis credentials
     - contains correct PROVIDER_TYPE (testrpc for development and rinkeby for production) and PROVIDER_URL (should be according to provider type)
     - NODE_ENV is set to required environment (development or production)
     - contains DEFAULT_ADDRESS and it's encrypted PRIVATE_KEY. To encrypt/decrypt a private key, use
        "npm run crypto encrypt/decrypt {PRIVATE_KEY} [SECRET_KEY]"
        where PRIVATE_KEY is private_key to encrypt/decrypt and SECRET_KEY is optional password phrase used to encrypt/decrypt. If not provided, will use SECRET_KEY from .env
     - In case of NODE_ENV=production (for rinkeby), should set CONTRACT_ADDRESS(address of ChainPay contract, the middle-man contract, not actual token contract) and PAYMENT_ADDRESS(actual token address)
## Initialization:
     - To initialize database, run `npm run initialize`. Please make sure you have NODE_ENV=production in your env file otherwise all your database will be cleared. 
    This script updates default ChainPay address and creates accounts in database from server/json/defaults.json based on network type (rinkey or testrpc)
### If you get `Client does not support authentication protocol requested by server; consider upgrading MySQL client`
    - ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password'
## Building Project
    - The source code is in ES6 syntax. To convert it into ES5 format, it needs to be build.
    - To build project, run `npm run build` command. This command makes sure that all changes in src folder are copied over to /dist folder (main executable folder).
    - Without building, changes in src folder would not take affect

# PM2(Recommended Process Manager)
    - pm2 is a good process manager which has been used for this project
    - to install pm2, run `npm install -g pm2`
    - This guide assumes we are using pm2 to run all services

## Running services
There are 3 components/services that are critical for this application
    1. Main Api
    2. Queue Manager
    3. Cronjob

All these services are supposed to be run in separate servers. However, they can also work together in a single server as well.
`Important: Before launching main api, please make sure queue and cron manager are working.`

### API Server
    This is the main nodejs server that handles all requests from the client side. It provides routes such as creating accounts, creating new transactions and getting status of a transaction etc. Each transaction is pushed into a redis queue and processed by queue manager.
    To start this service using pm2, run `pm2 start npm --name="api" -- run start`
    To start this service, run `npm start`

### Queue Manager
    This service processes transactions in redis queue using default account provided in .env. It also acts as nonce manager for that address and stores nonce in redis. It fetches 200 transactions from the redis queue and sends them to the Chainpay contract as a single transaction to be processed by contract.
    To start this service using pm2, run `pm2 start npm --name="queue" -- run queue`
    To start this service, run `npm run queue` 

### Cronjob
    This service handles receipts of the transactions from Chainpay contract. It runs every minute and checks all pending transactions for confirmation. If confirmed, it marks them as complete. It also runs another cronjob every minute to see if there are any transactions stuck in queue manager and re-activates them.
    To start this service using pm2, run `pm2 start npm --name="cron" -- run cron`
    To start this service using npm, run `npm run cron`

## Launching main application
    - Run `npm start` in root directory of application
    - Main api runs on port 4000. You can update it to use anyother port by updating PORT var in .env
    
## Starting test cases
    - Test modules assumes you have already setup your application, deployed contract and have some valid addresses with balances.
    - You can run testcases using command `npm run test`. This command uses `API_URL` and `TX_PER_SEC` variables from .env file.
    - `API_URL` variable specifies the remote server url against which test cases will be run.
    - `TX_PER_SEC` variable specifies number of transactions. E.g. TX_PER_SEC=100 means a total of 100 transactions will be sent to the server.
    - To override any of these variables in .env, you can append their value before `npm run test` command. E.g. to override `API_URL` value of .env, you can execute `API_URL=http://newurl.com npm run test` and testcases will be run on http://newurl.com
    - To override multiple .env vars, add them before `npm run test` command like this:
  `API_URL=http://newurl.com TX_PER_SEC=100 npm run test`
