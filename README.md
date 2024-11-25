# Zotra server

A small wrapper around [Zotero translation server](https://github.com/zotero/translation-server/) that adds support for fetching attachments and can be run from the command-line.

## Installation

First install [nodejs](https://nodejs.org/).
Then clone the repo and its submodules with
```bash
git clone --recurse-submodules https://github.com/mpedramfar/zotra-server.git
```
or 
```bash
git clone https://github.com/mpedramfar/zotra-server.git
git submodule update --init --recursive
```

Then you can install Zotra server with
```bash
cd zotra-server
npm install .
```
Now you can run the server with `npm start` or see the command-line usage with
```bash
node /path/to/zotra-server/bin/index.js --help
```

Alternatively, you can install it globally with the `-g` flag, i.e. `npm install -g .`.
In this case, to use from the command-line, you don't need to specify the full path:
```bash
zotra --help
```
The recommended installation method is the local install without the `-g` flag.

## Usage

Run the server with `npm start`.
Run `node /path/to/zotra-server/bin/index.js --help` to see the command-line options.
See [Zotero translation server](https://github.com/zotero/translation-server/) for more details.

## Configuration

The configuration file is located at config/default.json5
The only configuration option that is specific to this library is `tryServerFirst`.
When this is true and Zotra server is being called from the command-line, it will try to connect to a running instance of Zotra server (or Zotero translation server) first and if it fails, then tries without the server.


## Acknowledgements

The ability to handle attachments is based on a [patch](https://github.com/zotero/translation-server/pull/99) suggested by @noctux
