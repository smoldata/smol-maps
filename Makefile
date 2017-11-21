REFILL_VERSION = 9.0.1
WALKABOUT_VERSION = 6.0.0
BUBBLE_WRAP_VERSION = 8.0.0

all: node_packages leaflet-geocoder public-lib public-scene

node_packages:
	npm install

leaflet-geocoder:
	cd public/lib/leaflet-geocoder-mapzen && npm install
	cd public/lib/leaflet-geocoder-mapzen && npm run-script build
	rm -rf public/lib/leaflet-geocoder-mapzen/node_modules

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
