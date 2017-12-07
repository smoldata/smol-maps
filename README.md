# Smol Maps

## Remix on Glitch

1. Register a free [Mapzen API key](https://mapzen.com/dashboard)
2. [Edit **smol-maps** on Glitch](https://glitch.com/edit/#!/smol-maps) and click **Remix this 🎤** from the project drop-down
3. Click the **🕶 Show** button in the top-left corner
4. When prompted, enter the API key you just registered, and choose your default location

## Dependencies

* [node.js 8+](https://nodejs.org/en/)
* [curl](https://curl.haxx.se/)
* [make](https://www.gnu.org/software/make/)

## Installing node.js

If you are installing on a Mac or Windows, use the installer available on the [node.js homepage](https://nodejs.org/en/).

For Linux users installing via a package manager, you'll want to read the docs and [follow the instructions](https://nodejs.org/en/download/package-manager/) for your specific distribution (e.g., for [Debian-based distros, like Ubuntu](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)).

There is one more fun detail for Linux users. Depending on the distro you use, your node.js binary might be called `node` or `nodejs`. If you're running Ubuntu, for example, you use `nodejs`. If that's the case for you, instead of starting the server with `npm start` use `npm run-script startjs`.

## Setup

1. Register a free [Mapzen API key](https://mapzen.com/dashboard)
2. In a terminal, run these commands:  
    ```
    cd path/to/smol-maps
    make
    npm start
    ```
3. Load the website: http://localhost:4321/
4. When prompted, enter the API key you just registered, and choose your default location

## See also

* [php version](https://github.com/smoldata/php-smol-maps/)
