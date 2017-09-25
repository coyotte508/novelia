# novelia

## Requirements

```bash
sudo apt install nodejs npm ruby screen -y
sudo npm install -g n webpack nodemon

sudo gem install sass

sudo n latest
```

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
./scripts/start.sh
```

It will listen in port 8010 if not specified in `env.PORT`.
