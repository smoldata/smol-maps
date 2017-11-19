# Smol Maps

Note: this is a work in progress port from the more feature-complete [php-smol-maps](https://github.com/smoldata/php-smol-maps).

## Remix on Glitch

1. Register a free [Mapzen API key](https://mapzen.com/dashboard)
2. [Edit **smol-maps** on Glitch](https://glitch.com/edit/#!/smol-maps) and click **Remix this 🎤** from the project drop-down
3. Click the **🕶 Show** button in the top-left corner
4. When prompted, enter the API key you just registered, and choose your default location

## Dependencies

* [node.js 8+](https://nodejs.org/en/)
* [curl](https://curl.haxx.se/)
* [make](https://www.gnu.org/software/make/)

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
