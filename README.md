# zotra-cli

A small wrapper around [zotero translation server](https://github.com/zotero/translation-server/) that can be run from the command line.
This library adds the functionality to get the attachment urls.

## Installation

First install [nodejs](https://nodejs.org/).
Then clone the repo and its submodules with
```bash
git clone --recurse-submodules https://github.com/mpedramfar/zotra-cli.git
```
or 
```bash
git clone https://github.com/mpedramfar/zotra-cli.git
git submodule update --init --recursive
```

Then you can install `zotra-cli` with
```bash
cd zotra-cli
npm install -g .
```

## Usage

Run `zotra --help` to see the usage.
See [zotero translation server](https://github.com/zotero/translation-server/) for more details.

## Configuration

The configuration file is located at config/default.json5
The only configuration option that is specific to this library is `try_server_first`.
When this is true, `zotra-cli` will try to connect to a running instance of translation server first and if it fails, then tries without the server.

Note that `zotra server` will run a modified version of the translation server that supports fetching attachment urls.


## Acknowledgements

The ability to handle attachments is based on a [patch](https://github.com/zotero/translation-server/pull/99) suggested by @noctux
