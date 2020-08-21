# chainpay
Documentation prepared for Ubuntu 16.04 LTS.

## prerequisite
as root 

    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    apt-get install -y nodejs
    apt-get install build-essential

    sudo apt-get install mysql-server
    sudo apt-get install mysql-client

switch back to user


## Installing node modules
    - Install required node modules by executing command `npm install` in root directory of the project
    
## Setting up database
    - Before launching main application, please make sure you have a mysql database named `ethereum_api`. To do that, open your mysql terminal as root (`mysql -uroot`) and run command `create database ethereum_api`.

## Starting ethereum node
    - You should have an ethereum local node configured to launch main app. For this guide, we will assume that you have setup testrpc. You can install it by running `npm install -g ganache-cli` on your command line. 
    - To start ethereum node, run command `ganache-cli -m "chainpay"`
    - Note your node listening port and update it accordingly in .env file

## Starting redis-cli
    - This app requires redis-cli for queue management.
    - follow this guide to install redis if not already installed
    https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-redis-on-ubuntu-16-04
## Launching main application
    - Please make sure .env file matches your mysql and testrpc node configuration. If not, please update it before starting application
    - Run `npm start` in root directory of application
    
## Starting test cases
    - Run `npm run test` in root directory
