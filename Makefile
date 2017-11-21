REFILL_VERSION = 9.0.1
WALKABOUT_VERSION = 6.0.0
BUBBLE_WRAP_VERSION = 8.0.0
LEAFLET_GEOCODER_VERSION = 1.9.4

all: node_packages leaflet-geocoder public-lib public-scene

node_packages:
	npm install

leaflet-geocoder:
	@echo "Instead of 'npm run-script build' we download Leaflet Geocoder assets from a CDN"
	curl -s -o public/lib/leaflet-geocoder-mapzen/dist/leaflet-geocoder-mapzen.css https://cdnjs.cloudflare.com/ajax/libs/leaflet-geocoder-mapzen/1.9.4/leaflet-geocoder-mapzen.css
	curl -s -o public/lib/leaflet-geocoder-mapzen/dist/leaflet-geocoder-mapzen.min.css https://cdnjs.cloudflare.com/ajax/libs/leaflet-geocoder-mapzen/1.9.4/leaflet-geocoder-mapzen.min.css
	curl -s -o public/lib/leaflet-geocoder-mapzen/dist/leaflet-geocoder-mapzen.js https://cdnjs.cloudflare.com/ajax/libs/leaflet-geocoder-mapzen/1.9.4/leaflet-geocoder-mapzen.js
	curl -s -o public/lib/leaflet-geocoder-mapzen/dist/leaflet-geocoder-mapzen.min.js https://cdnjs.cloudflare.com/ajax/libs/leaflet-geocoder-mapzen/1.9.4/leaflet-geocoder-mapzen.min.js

public-lib:
	./node_modules/bower/bin/bower install

public-scene:
	@name=bubble-wrap version=$(BUBBLE_WRAP_VERSION) make scene
	@name=refill-style version=$(REFILL_VERSION) make scene
	@name=walkabout-style version=$(WALKABOUT_VERSION) make scene

scene:
	@echo "installing $(name) v$(version)"
	@curl -o $(name).zip -Ls https://github.com/tangrams/$(name)/archive/v$(version).zip
	@unzip -q $(name).zip
	@rm -rf public/scene/$(name)
	@mv $(name)-$(version) public/scene/$(name)
	@mv $(name).zip public/scene/$(name)/$(name)-$(version).zip
