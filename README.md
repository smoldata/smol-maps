# Smol Maps

Note: this is a work in progress.

## Dependencies

* [node.js 8+](https://nodejs.org/en/)
* [curl](https://curl.haxx.se/)
* [make](https://www.gnu.org/software/make/)

## Quick setup

1. Register a [Mapzen API key](https://mapzen.com/dashboard)
2. In a terminal, run (replace `mapzen-xxxxx` with your API key):  
    ```
    cd path/to/smol-maps
    make
    export PORT=4321
    export MAPZEN_API_KEY=mapzen-xxxxx
    npm start
    ```
3. Load the website: http://localhost:4321/
