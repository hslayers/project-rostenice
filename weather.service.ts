import Cartesian2 from 'cesium/Source/Core/Cartesian2';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import CesiumMath from 'cesium/Source/Core/Math';
import VerticalOrigin from 'cesium/Source/Scene/VerticalOrigin';
import NearFarScalar from 'cesium/Source/Core/NearFarScalar';
import LabelGraphics from 'cesium/Source/DataSources/LabelGraphics';
import HeightReference from 'cesium/Source/Scene/HeightReference';
import LabelStyle from 'cesium/Source/Scene/LabelStyle';
import {Style, Stroke} from 'ol/style';
import { Injectable, Type } from '@angular/core';
import { HsUtilsService } from 'hslayers-ng/components/utils/utils.service';
import VectorLayer from 'ol/layer/Vector';
import {Vector} from 'ol/source';
import Color from 'cesium/Source/Core/Color';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  points = [];
  entities = [];
  isPlaying: boolean;
  viewer: any;
  currentPoint: number;
  src: any;
  lyr: any;
  animationTimer: any;
  forecastMarkerClicks: Subject<any> = new Subject();
  constructor(private HsUtilsService: HsUtilsService) {

  }

  getCrossings(points, service, name, cb) {
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      var entity = this.entities[i];
      var data: any = {
        apikey: '8vh83gfhu34g',
        lat: p.lat,
        lon: p.lon,
        asl: 258,
        tz: 'Europe/Athens',
        city: p.name || ''
      };
      if (service == 'meteogram_agroSowing') data.look = 'all';
      var params = Object.keys(data).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
      }).join('&');
      var url = this.HsUtilsService.proxify(`http://my.meteoblue.com/visimage/${service}?${params}`, false);
      var img = new Image();
      img.onload = (function (point, ent) {
        return function () {
          var img = this;
          var oc = document.createElement('canvas'),
            octx = oc.getContext('2d');
          var ratio = 1;
          if (img.width > 600) ratio = 600 / img.width;
          if (img.height * ratio > 600) ratio = 600 / (img.height * ratio);
          var heightOffset = 25;
          oc.width = img.width * ratio;
          oc.height = img.height * ratio + heightOffset;
          octx.drawImage(img, 0, 0, oc.width, oc.height - heightOffset);
          octx.beginPath();
          octx.strokeStyle = 'white 2px';
          octx.arc(oc.width / 2, oc.height - 6, 6, 0, 2 * Math.PI);
          octx.stroke();
          octx.beginPath();
          octx.strokeStyle = 'black';
          octx.arc(oc.width / 2, oc.height - 7, 7, 0, 2 * Math.PI);
          octx.stroke();
          var imageUrl = oc.toDataURL();
          ent.billboard.image = imageUrl;
          ent.properties.image.setValue(imageUrl);
          ent.currentForecast = name;
          for(let f of this.src.getFeatures()) {
            if (f.get('ix') == ent.properties.ix.getValue().toString()) {
              f.set('image', imageUrl)
            }
          };
          var ocfull = document.createElement('canvas'),
            ofullctx = ocfull.getContext('2d');
          ocfull.width = img.width;
          ocfull.height = img.height;
          ofullctx.drawImage(img, 0, 0, ocfull.width, ocfull.height);
          ent.fullImage = ocfull.toDataURL();
          point.forecasts.push({ name, fullImage: ent.fullImage, updated: (new Date()).toISOString() });
          cb();
        }
      })(p, entity);;
      img.src = url;
    }
  }

  playInterpolated() {
    var viewer = this.viewer;
    this.isPlaying = true;
    //Set bounds of our simulation time

    function flyNext() {
      var point = this.points[this.currentPoint];
      var entity = point.entity;
      viewer.trackedEntity = entity;
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(point.lon, point.lat - 0.008, 1020.0),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: CesiumMath.toRadians(-40.0),
          roll: 0.0
        },
        duration: 5,
        complete: function () {
          this.currentPoint = (this.currentPoint + 1) % this.points.length;
          this.animationTimer = setTimeout(flyNext, 10000)
        }
      });
    }
    this.currentPoint = 0;
    flyNext();
  }

  stopPlaying() {
    clearTimeout(this.animationTimer);
    this.isPlaying = false;
  }

  createLayer() {
    var src = new Vector();
    src.cesiumStyler = function (dataSource) {
      var entities = dataSource.entities.values;
      this.entities = entities;
      for (var i = 0; i < entities.length; i++) {
        var entity = entities[i];
        if (entity.styled) continue;
        entity.billboard.image = entity.properties.image.getValue().toString();
        entity.billboard.eyeOffset = new Cartesian3(0.0, 0.0, -500.0);
        entity.billboard.scaleByDistance = new NearFarScalar(50, 1.2, 20000, 0.1);
        entity.label = new LabelGraphics({
          text: entity.properties.ix.getValue().toString(),
          font: '18px Helvetica',
          fillColor: Color.WHITE,
          outlineColor: new Color(0.1, 0.1, 0.1, 0.9),
          showBackground: true,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(30, -1),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          eyeOffset: new Cartesian3(0.0, 0.0, -500.0),
          scaleByDistance: new NearFarScalar(50, 1, 20000, 0.2)
        })
        entity.styled = true;
        entity.onclick = (entity) => this.forecastMarkerClicks.next(entity);
      }
    }
    var lyr = new VectorLayer({
      title: "Weather forecast locations",
      source: src,
      visible: true,
      style: function (feature, resolution) {
        return [
          new Style({
            stroke: new Stroke({
              color: 'rgba(0, 0, 0, 1)',
              width: 2
            })
          })
        ];
      }
    });
    this.src = src;
    this.lyr = lyr;
    return lyr;
  }

}
