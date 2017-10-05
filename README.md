# novelia

## Requirements

```bash
sudo apt install nodejs npm ruby screen mongodb-server mongodb-client -y
sudo npm install -g n webpack nodemon

sudo gem install sass

sudo n latest
```

## Mongodb Configuration

```bash
sudo usermod -aG mongodb $USER
sudo mkdir -p /data/db
sudo chmod 0775 /data/db
sudo chown -R mongodb:mongodb /data/db
```

A logout/login will be needed

## Nginx configuration

In the project's directory:

```bash
sudo cp config/nginx /etc/nginx/sites-available/novelia
sudo ln -s /etc/nginx/sites-available/novelia /etc/nginx/sites-enabled/novelia
```

Edit the `root` directive of `/etc/nginx/sites-available/novelia` to reflect the project's public subfolder.

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
