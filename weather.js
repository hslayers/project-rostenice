import map from 'map.module';
import core from 'core';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';
import Feature from 'ol/Feature';
import { Polygon, LineString, GeometryType, Point, Circle as CircleGeom } from 'ol/geom';
import { transform } from 'ol/proj';

angular.module('hs.weather', ['hs.core', 'hs.map'])

    .directive('hs.weather.directive', function () {
        return {
            template: require('weather.directive.html')
        };
    })

    .directive('hs.weather.toolbar', function () {
        return {
            template: require('weather-toolbar.directive.html')
        };
    })


    .service("hs.weather.service", ['Core', 'hs.utils.service', '$rootScope',
        function (Core, utils, $rootScope) {
            var me = {
                getCrossings: function (points, service, name, cb) {
                    for (var i = 0; i < points.length; i++) {
                        var p = points[i];
                        var entity = me.entities[i];
                        var data = {
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
                        var url = utils.proxify(`http://my.meteoblue.com/visimage/${service}?${params}`, false);
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
                                octx.strokeStyle = 'white';
                                octx.strokeWidth = '2';
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
                                angular.forEach(me.src.getFeatures(), function (f) {
                                    if (f.get('ix') == ent.properties.ix.getValue().toString()) {
                                        f.set('image', imageUrl)
                                    }
                                });
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
                },
                playInterpolated() {
                    var viewer = me.viewer;
                    me.isPlaying = true;
                    //Set bounds of our simulation time

                    function flyNext() {
                        var point = me.points[me.currentPoint];
                        var entity = point.entity;
                        viewer.trackedEntity = entity;
                        viewer.camera.flyTo({
                            destination: Cesium.Cartesian3.fromDegrees(point.lon, point.lat - 0.008, 1020.0),
                            orientation: {
                                heading: Cesium.Math.toRadians(0),
                                pitch: Cesium.Math.toRadians(-40.0),
                                roll: 0.0
                            },
                            duration: 5,
                            complete: function () { 
                                me.currentPoint = (me.currentPoint + 1) % me.points.length;
                                me.animationTimer = setTimeout(flyNext, 10000) }
                        });
                    }
                    me.currentPoint = 0;
                    flyNext();
                },

                stopPlaying(){
                    clearTimeout(me.animationTimer);
                    me.isPlaying = false;
                },

                createLayer() {
                    function entityClicked(entity) {
                        $rootScope.$broadcast('forecast_marker_clicked', entity);
                    }

                    var src = new Vector();
                    src.cesiumStyler = function (dataSource) {
                        var entities = dataSource.entities.values;
                        me.entities = entities;
                        for (var i = 0; i < entities.length; i++) {
                            var entity = entities[i];
                            if (entity.styled) continue;
                            entity.billboard.image = entity.properties.image.getValue().toString();
                            entity.billboard.eyeOffset = new Cesium.Cartesian3(0.0, 0.0, -500.0);
                            entity.billboard.scaleByDistance = new Cesium.NearFarScalar(50, 1.2, 20000, 0.1);
                            entity.label = new Cesium.LabelGraphics({
                                text: entity.properties.ix.getValue().toString(),
                                font: '18px Helvetica',
                                fillColor: Cesium.Color.WHITE,
                                outlineColor: new Cesium.Color(0.1, 0.1, 0.1, 0.9),
                                showBackground: true,
                                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                pixelOffset: new Cesium.Cartesian2(30, -1),
                                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                                eyeOffset: new Cesium.Cartesian3(0.0, 0.0, -500.0),
                                scaleByDistance: new Cesium.NearFarScalar(50, 1, 20000, 0.2)
                            })
                            entity.styled = true;
                            entity.onclick = entityClicked
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
                    me.src = src;
                    me.lyr = lyr;
                    return lyr;
                }
            };
            return me;
        }
    ])
    .controller('hs.weather.controller', ['$scope', 'hs.map.service', 'Core', 'config', 'hs.weather.service', '$timeout', '$compile', '$http',
        function ($scope, OlMap, Core, config, service, $timeout, $compile, $http) {
            service.points = [];
            $scope.loading = false;
            $scope.points = service.points;
            $scope.service = service;
            $scope.$on('cesium_position_clicked', function (event, data) {
                var point = {
                    lon: data[0].toFixed(2),
                    lat: data[1].toFixed(2),
                    ix: service.points.length,
                    forecasts: []
                };
                service.points.push(point);
                $http.get(`http://api.geonames.org/findNearbyPlaceNameJSON?lat=${point.lat}&lng=${point.lon}&username=raitis`).then(function (r) {
                    if (r.data.geonames.length > 0)
                        point.name = r.data.geonames[0].name
                });
                service.src.addFeatures([new Feature({
                    geometry: new Point(transform([data[0], data[1]], 'EPSG:4326', OlMap.map.getView().getProjection().getCode())),
                    ix: service.points.length - 1,
                    image: './img/symbols/other.png'
                })]);
                service.src.dispatchEvent('features:loaded', service.src);
            });

            $scope.getCrossings = function (serviceName, name) {
                $scope.loading = true;
                service.getCrossings(service.points, serviceName, name, function () {
                    $scope.loading = false;
                })
            };

            $scope.clear = function () {
                service.points = [];
                service.src.clear();
                service.src.dispatchEvent('features:loaded', service.src);
            }

            $scope.showForecast = function (forecast) {
                if (document.querySelector('#info-dialog')) {
                    var parent = document.querySelector('#info-dialog').parentElement;
                    parent.parentElement.removeChild(parent);
                }
                var el = angular.element('<div hs.info-directive></div>');
                el[0].setAttribute('image', forecast.fullImage);
                document.querySelector("#hs-dialog-area").appendChild(el[0]);
                $scope.name = forecast.name;
                $compile(el)($scope);
            }

            $scope.$on('forecast_marker_clicked', function (event, entity) {
                if (document.querySelector('#info-dialog')) {
                    var parent = document.querySelector('#info-dialog').parentElement;
                    parent.parentElement.removeChild(parent);
                }
                var el = angular.element('<div hs.info-directive></div>');
                el[0].setAttribute('image', entity.fullImage);
                document.querySelector("#hs-dialog-area").appendChild(el[0]);
                $scope.name = entity.currentForecast;
                $compile(el)($scope);
            });

            $scope.$on('cesiummap.loaded', function (event, viewer, hsCesium) {
                service.viewer = viewer;
                /*setInterval(function(){
                    var pos = Cesium.Cartographic.fromCartesian(viewer.camera.position);
                    var lastEnt = service.entities[service.entities.length-1];
                    var lastEntPos = Cesium.Cartographic.fromCartesian(lastEnt.position._value);
                    //console.log('Ent pos ' + Cesium.Math.toDegrees(lastEntPos.longitude) + ' ' + Cesium.Math.toDegrees(lastEntPos.latitude))
                    console.log('Cam pos ' + Cesium.Math.toDegrees(pos.longitude) + ' ' + Cesium.Math.toDegrees(pos.latitude) , 'pitch ' + Cesium.Math.toDegrees(viewer.camera.pitch), 'heading' + Cesium.Math.toDegrees(viewer.camera.heading));
                }, 1000);*/
            });

            $scope.play = function () {
                if(service.isPlaying)
                    service.stopPlaying();
                else
                    service.playInterpolated();
            }

            $scope.$emit('scope_loaded', "weather");
        }
    ]);
