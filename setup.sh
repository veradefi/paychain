# Default program to edit files
editor=vim

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

# defaul step 

# Set default editor 
echo -e "Select text editor:\n [1] vim \n [2] nano"
read x
if [ "$x" == "2" ]
then
    editor=nano
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

    # install mysql
    sudo apt-get -y install mysql-client
    sudo apt-get -y install mysql-server-5.7 

    # start mysql service
    sudo service mysql start

    # set mysql to use native password for root
    sudo mysql  mysql  -e "UPDATE user SET plugin='mysql_native_password' WHERE User='root';"
    sudo mysql  mysql  -e "FLUSH PRIVILEGES;"
    sudo service mysql restart
    setstep 1
fi

if [ $step -lt "2" ] 
then

    # Secure my sql installation
    echo "Securing mysql installation" 
    sudo mysql_secure_installation
    setstep 2
fi


if [ $step -lt "3" ] 
then
    # Install Redis
    cd /tmp
    curl -O http://download.redis.io/redis-stable.tar.gz
    tar xzvf redis-stable.tar.gz
    cd redis-stable
    make
    make test
    sudo make install
    sudo mkdir /etc/redis
    sudo cp /tmp/redis-stable/redis.conf /etc/redis


    # Configure redis
    sudo sed -i "s/supervised no/supervised systemd/" /etc/redis/redis.conf
    sudo sed -i "s#dir ./#dir /var/lib/redis#" /etc/redis/redis.conf


    # Add redis user
    sudo adduser --system --group --no-create-home redis
    sudo mkdir /var/lib/redis
    sudo chown redis:redis /var/lib/redis
    sudo chmod 770 /var/lib/redis
    cd $home
    setstep 3
fi

if [ $step -lt "4" ] 
then

    #  Setup & start redis service
    sudo cp config/redis.service  /etc/systemd/system/redis.service
    sudo systemctl start redis

    setstep 4
fi

if [ $step -lt "5" ] 
then
    # Create App database

    echo "Create database ethereum_api"
    echo "Enter MySql root password"
    echo "create database ethereum_api" | mysql -uroot -p

    # Set .config ownership
    # Yarn setup change some of .config subdirectory to root

    sudo chown ubuntu:ubuntu ~/.config -R

    # Install required node packages
    npm install 

    # Create local environment file
    cp .env.example  .env

    setstep 5
fi

if [ $step -lt "6" ] 
then
    ans=n
    # Open editor for user to configure
    $editor .env
    echo "Done editing ? "
    setstep 6
fi

if [ $step -lt "7" ] 
then
    # Initialize 
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
