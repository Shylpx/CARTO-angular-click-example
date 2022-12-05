import {
  Component,
  AfterViewInit,
  NgZone,
  ElementRef,
  ViewChild,
} from '@angular/core';

import { Map as MapboxMap } from 'mapbox-gl';

import { Deck } from '@deck.gl/core';
import {
  setDefaultCredentials,
  BASEMAP,
  API_VERSIONS,
  MAP_TYPES,
  CartoLayer,
} from '@deck.gl/carto';

setDefaultCredentials({
  apiBaseUrl: 'https://gcp-us-east1.api.carto.com',
  apiVersion: API_VERSIONS.V3,
  accessToken:
    'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfbHFlM3p3Z3UiLCJqdGkiOiI1YjI0OWE2ZCJ9.Y7zB30NJFzq5fPv8W5nkoH5lPXFWQP0uywDtqUg8y8c',
});

const INITIAL_VIEW_STATE = {
  longitude: -97.2,
  latitude: 44.33,
  zoom: 3,
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  public deck: any = null;
  public geojsonData$: any = null;
  private layers: any[] = [];

  @ViewChild('mapboxContainer', { static: true }) mapboxContainer!: ElementRef;
  @ViewChild('deckCanvas', { static: true }) deckCanvas!: ElementRef;

  constructor(private zone: NgZone) { }

  ngAfterViewInit() {
    this.launchMap(INITIAL_VIEW_STATE);
    this.addLayers();
  }

  private launchMap(initialViewState: any) {
    this.zone.runOutsideAngular(() => {
      const map = new MapboxMap({
        container: this.mapboxContainer.nativeElement,
        style: BASEMAP.POSITRON,
        interactive: false,
        center: [initialViewState.longitude, initialViewState.latitude],
        zoom: initialViewState.zoom,
        accessToken:
          'pk.eyJ1IjoiY2FydG9kYmluYyIsImEiOiJja2xyeGp6ZjEwNHBxMnFvM2c3OWVtcThiIn0.qefChoeHY64sEtCUJ-c2ag',
      });

      this.deck = new Deck({
        canvas: this.deckCanvas.nativeElement,
        initialViewState,
        controller: true,
        onBeforeRender: () => {
          if (this.deck) {
            const viewport = this.deck.getViewports()[0];
            map.jumpTo({
              center: [viewport.longitude, viewport.latitude],
              zoom: viewport.zoom,
              bearing: viewport.bearing,
              pitch: viewport.pitch,
            });
            this.redrawMapbox(map);
          }
        },
      });

      this.setDeckInstance(this.deck);
    });
  }

  redrawMapbox(map: any) {
    if (map.style) {
      if (map._frame) {
        map._frame.cancel();
        map._frame = null;
      }
      map._render();
    }
  }

  setDeckInstance(deck: any) {
    this.deck = deck;
    this.updateDeck();
  }

  updateDeck() {
    this.deck.setProps({ layers: [...this.layers] });
  }

  addLayers() {
    this.layers = [
      new CartoLayer({
        id: 'layer1',
        connection: 'bqconn',
        type: MAP_TYPES.QUERY,
        data: 'SELECT geom, name FROM cartobq.public_account.populated_places',
        visible: true,
        pointRadiusUnits: 'pixels',
        getFillColor: [82, 190, 128],
        getLineColor: [255, 255, 255],
        lineWidthMinPixels: 2,
        pointRadiusMinPixels: 6,
      })
    ]
    this.updateDeck()
  }
}
