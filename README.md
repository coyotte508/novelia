# novelia

## Requirements

```bash
#Optional, for latest mongo
#sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
#echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
#sudo apt update
sudo apt install nodejs npm ruby ruby-dev screen mongodb-org libffi-dev -y
sudo npm install -g n webpack nodemon
sudo systemctl unmask mongodb

sudo gem install sass

sudo n latest
```

## Mongodb Configuration

```bash
# sudo service mongodb restart

sudo usermod -aG mongodb $USER
sudo mkdir -p /data/db
sudo chmod 0775 /data/db
sudo chown -R mongodb:mongodb /data/db

# A logout/login is needed
```

## Nginx configuration

In the project's directory:

```bash
sudo cp app/config/nginx /etc/nginx/sites-available/novelia
sudo ln -s /etc/nginx/sites-available/novelia /etc/nginx/sites-enabled/novelia
# Give proper path for public files
sudo sed -i -e 's:root .*;:root '`pwd`'/public;:' /etc/nginx/sites-available/novelia
sudo rm /etc/nginx/sites-enabled/default 
sudo service nginx restart
```

You may have a 403 forbidden error regarding js and css files if the folder is under your home folder, then you need to either give more permissions to your home folder or move the project elsewhere.

## Update

In the project's directory

```bash
npm install
webpack
```

## Run

```bash
./scripts/start.sh #webpack and nodemon server.js, and mongod
```

It will listen in port 8010 if not specified in `env.PORT`.
