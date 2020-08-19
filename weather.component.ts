import { Component, Input, ViewRef } from '@angular/core';
import { HsPanelComponent } from 'hslayers-ng/components/layout/panels/panel-component';
import { HsPanelContainerService } from 'hslayers-ng/components/layout/panels/panel-container.service';
import { WeatherService } from './weather.service';
import { HsConfig } from 'hslayers-ng/config.service';
import { HsMapService } from 'hslayers-ng/components/map/map.service';
import { Point } from 'ol/geom';
import { transform } from 'ol/proj';
import { Feature } from 'ol';
import { HsDialogContainerService } from 'hslayers-ng/components/layout/dialogs/dialog-container.service';
import { InfoDialogComponent } from './info-dialog.component';
import { HsCesiumService } from 'hslayers-ng/components/hscesium/hscesium.service';
import {HttpClient} from '@angular/common/http';

@Component({
    selector: 'weather',
    template: require('./weather.html'),
})
export class WeatherComponent
    implements HsPanelComponent {
    @Input() data: any;
    viewRef: ViewRef;
    loading = false;

    constructor(
        private HsPanelContainerService: HsPanelContainerService,
        private WeatherService: WeatherService,
        private HsMapService: HsMapService,
        private HsDialogContainerService: HsDialogContainerService,
        private HsCesiumService: HsCesiumService,
        private HttpClient: HttpClient,
        HsConfig: HsConfig
    ) {
        HsConfig.default_layers.push(WeatherService.createLayer());
        this.WeatherService.forecastMarkerClicks.subscribe((entity) => {
            this.HsDialogContainerService.create(
                InfoDialogComponent,
                { image: entity.fullImage, name: entity.currentForecast }
            );
        });

        this.HsCesiumService.cesiumPositionClicked.subscribe(async(data) => {
            var point: any = {
                lon: data[0].toFixed(2),
                lat: data[1].toFixed(2),
                ix: this.WeatherService.points.length,
                forecasts: []
            };
            this.WeatherService.points.push(point);
            const r: any = await this.HttpClient.get(`http://api.geonames.org/findNearbyPlaceNameJSON?lat=${point.lat}&lng=${point.lon}&username=raitis`).toPromise();
                if (r.geonames.length > 0)
                    point.name = r.geonames[0].name
            this.WeatherService.src.addFeatures([new Feature({
                geometry: new Point(transform([data[0], data[1]], 'EPSG:4326', this.HsMapService.map.getView().getProjection().getCode())),
                ix: this.WeatherService.points.length - 1,
                image: './img/symbols/other.png'
            })]);
            this.WeatherService.src.dispatchEvent('features:loaded', this.WeatherService.src);
        });
    }

    getCrossings(serviceName, name) {
        this.loading = true;
        this.WeatherService.getCrossings(this.WeatherService.points, serviceName, name, function () {
            this.loading = false;
        })
    };

    clear() {
        this.WeatherService.points = [];
        this.WeatherService.src.clear();
        this.WeatherService.src.dispatchEvent('features:loaded', this.WeatherService.src);
    }

    showForecast(forecast) {
        this.HsDialogContainerService.create(
            InfoDialogComponent,
            { image: forecast.fullImage, name: forecast.name }
        );
    }

    play() {
        if (this.WeatherService.isPlaying)
            this.WeatherService.stopPlaying();
        else
            this.WeatherService.playInterpolated();
    }
}
