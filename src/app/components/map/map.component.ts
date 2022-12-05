import {
  Component,
  AfterViewInit,
  NgZone,
  ElementRef,
  ViewChild,
  Output,
  ChangeDetectionStrategy,
  EventEmitter,
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
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit {
  public deck: any = null;
  public geojsonData$: any = null;
  private layers: any[] = [];

  public popupInfo: any = null;
  public position: any = [0, 0];

  @ViewChild('mapboxContainer', { static: true }) mapboxContainer!: ElementRef;
  @ViewChild('deckCanvas', { static: true }) deckCanvas!: ElementRef;

  @Output() popupInfoEmitter = new EventEmitter();
  @Output() positionEmitter = new EventEmitter();

  constructor(private zone: NgZone) { }

  ngAfterViewInit() {
    this.launchMap(INITIAL_VIEW_STATE);
    this.addLayers();
  }

  private launchMap(initialViewState: any) {
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
      onViewStateChange: () => {
        if (!this.popupInfo) return;

        const newPosition = this.coordinates2pixels(this.popupInfo.coordinates, this.deck)
        if (!newPosition) return;

        this.position = newPosition
        this.positionEmitter.emit(this.position)
      },
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
  }

  private coordinates2pixels(coordinates: any, deckInstance: any) {
    let pixels

    if (deckInstance) {
      try {
        const viewports = deckInstance.getViewports(undefined)
        const viewport = viewports[0]

        if (viewport) {
          pixels = viewport.project(coordinates)
        }
      } catch (e) {
        console.warn('viewManager in deckInstance not ready yet')
      }
    }

    return pixels
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
        pickable: true,
        onClick: (info: any) => {
          console.log(info)

          this.popupInfo = {
            coordinates: info.object.geometry.coordinates,
            propsObject: {
              name: info.object.properties.name
            },
            closeOnMove: false,
            showCloseButton: false,
          }
          this.position = this.coordinates2pixels(info.object.geometry.coordinates, this.deck)

          this.popupInfoEmitter.emit(this.popupInfo)
          if (!this.position) return;
          this.positionEmitter.emit(this.position)
        }
      })
    ]
    this.updateDeck()
  }
}
