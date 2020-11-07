# Default program to edit files

home=$(pwd)

function setstep { 
    rm -f ~/.chainpay_step
    echo $1 > ~/.chainpay_step
    step=$1
}

if [ -f ~/.chainpay_step ] 
then
    step=$(cat ~/.chainpay_step )
else
    step=0
fi

# Output commands while executing the script
# Exit script on Error
set -ex


if [ $step -eq "0" ] 
then
    # Update  & upgrade

    sudo apt-get update
    sudo apt-get -y upgrade

    # Install required packages
    sudo apt-get -y install build-essential git tcl curl vim systemd

    # Install Node 10
    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Install yarn, gulp, and pm2
    sudo npm install -g yarn
    sudo npm install -g gulp
    sudo npm install -g pm2

    setstep 4
fi



if [ $step -lt "5" ] 
then

    sudo chown ubuntu:ubuntu ~/.config -R

    # Install required node packages
    npm install 

    # Create local environment file
    cp .env.sandbox .env

    setstep 5
fi

if [ $step -lt "6" ] 
then
    # Open editor for user to configure
    setstep 6
fi

if [ $step -lt "7" ] 
then
    # Initialize 
    npm run build
    npm run initialize

    pm2 start npm --name="chainpay cron"  -- run cron
    pm2 start npm --name="chainpay queue" -- run queue
    pm2 start npm --name="chainpay api"   -- run start

    pm2 list
    sleep 20s
    npm run test
    setstep 7
fi


if [ $step -eq "7" ] 
then
    echo "App was setup and running. "

    #clean up
    rm ~/.chainpay_step
fi
