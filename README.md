# novelia

## Requirements

```bash
sudo apt install nodejs npm ruby -y
sudo npm install -g n webpack nodemon

sudo gem install sass

sudo n latest
```

In the project's directory:

```bash
npm install unicode
```
## Nginx configuration

In the project's directory:

```bash
sudo cp config/nginx /etc/nginx/sites-available/novelia
sudo ln -s /etc/nginx/sites-available/novelia /etc/nginx/sites-enabled/novelia
```

Edit the `root` directive of `/etc/nginx/sites-available/novelia` to reflect the project's public subfolder.

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