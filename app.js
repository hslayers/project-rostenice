'use strict';
import toolbar from 'toolbar.module';
import print from 'print.module';
import query from 'query.module';
import search from 'search.module';
import measure from 'measure.module';
import permalink from 'permalink.module';
import 'hscesium.module';
import info from 'info.module';
import ds from 'datasource-selector.module';
import sidebar from 'sidebar.module';
import 'add-layers.module';
import bootstrapBundle from 'bootstrap/dist/js/bootstrap.bundle';
import { Tile, Group } from 'ol/layer';
import { TileWMS, WMTS, OSM, XYZ } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import View from 'ol/View';
import { transform, transformExtent } from 'ol/proj';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import weather from 'weather';

var module = angular.module('hs', [
    'hs.toolbar',
    'hs.layermanager',
    'hs.query',
    'hs.search', 'hs.print', 'hs.permalink',
    'hs.datasource_selector',
    'hs.geolocation',
    'hs.cesium',
    'hs.sidebar',
    'hs.addLayers',
    'hs.weather'
]);

module.directive('hs', function (HsCore, $timeout, HsLayoutService) {
    'ngInject';
    return {
        template: HsCore.hslayersNgTemplate,
        link: function (scope, element) {
            $timeout(function () {
                HsLayoutService.fullScreenMap(element, HsCore);
                scope.createAboutDialog();
            }, 0);
        }
    };
});

module.directive('hs.aboutproject', function () {
    function link(scope, element, attrs) {
       scope.aboutVisible = true;
    }
    return {
        template: require('./about.html'),
        link: link
    };
});

module.directive('hs.infoDirective', function () {
    return {
        template: require('./info.html'),
        link: function (scope, element, attrs) {
            scope.infoModalVisible = true;
            scope.image = attrs.image;
        }
    };
});

function getHostname() {
    var url = window.location.href
    var urlArr = url.split("/");
    var domain = urlArr[2];
    return urlArr[0] + "//" + domain;
};

module.value('HsConfig', {
    proxyPrefix: '/proxy/',
    cesiumBase: './node_modules/cesium/Build/Cesium/',
    cesiumAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDk3ZmM0Mi01ZGFjLTRmYjQtYmFkNC02NTUwOTFhZjNlZjMiLCJpZCI6MTE2MSwiaWF0IjoxNTI3MTYxOTc5fQ.tOVBzBJjR3mwO3osvDVB_RwxyLX7W-emymTOkfz6yGA',
    newTerrainProviderOptions: {
        url: '/proxy/http://gis.lesprojekt.cz/cts/tilesets/rostenice_dmp1g/'
    },
    terrain_providers: [{
        title: 'Local surface model',
        url: '/proxy/http://gis.lesprojekt.cz/cts/tilesets/rostenice_dmp1g/',
        active: true
    }, {
        title: 'Local terrain model',
        url: '/proxy/http://gis.lesprojekt.cz/cts/tilesets/rostenice_dmr5g/',
        active: false
    }, {
        title: 'EU-DEM',
        url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
        active: false
    }],
    default_layers: [
        new Tile({
            source: new OSM(),
            title: "OpenStreetMap",
            base: true,
            visible: false,
            minimumTerrainLevel: 15
        }),
        new Tile({
            title: "Open-Land-Use (WMS)",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/olu/openlandusemap.map',
                params: {
                    LAYERS: 'olu_bbox_srid',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 15
                },
                crossOrigin: null
            }),
            legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/openlandusemap.map&service=WMS&request=GetLegendGraphic&layer=olu_bbox_srid&version=1.3.0&format=image/png&sld_version=1.1.0'],
            maxResolution: 8550,
            visible: false,
            opacity: 0.7
        }),
        new Tile({
            title: "Slope (in degrees)",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map',
                params: {
                    LAYERS: 'slope',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 14
                },
                crossOrigin: null
            }),
            legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map&service=WMS&request=GetLegendGraphic&layer=slope&version=1.3.0&format=image/png&sld_version=1.1.0'],
            maxResolution: 8550,
            visible: false,
            opacity: 0.7
        }),
        new Tile({
            title: "Slope orientation",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map',
                params: {
                    LAYERS: 'orientation',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 14
                },
                crossOrigin: null
            }),
            legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map&service=WMS&request=GetLegendGraphic&layer=orientation&version=1.3.0&format=image/png&sld_version=1.1.0'],
            maxResolution: 8550,
            visible: false,
            opacity: 0.7
        }),
        new Tile({
            title: "Normalized difference vegetation index (NDVI) ",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map',
                params: {
                    LAYERS: 'ndvi_rostenice',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 14
                },
                crossOrigin: null
            }),
            legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map&service=WMS&request=GetLegendGraphic&layer=ndvi_rostenice&version=1.3.0&format=image/png&sld_version=1.1.0'],
            maxResolution: 8550,
            visible: false,
            opacity: 0.7
        }),
        new Tile({
            title: "Compound topographic index (CTI)",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map',
                params: {
                    LAYERS: 'cti_rostenice',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 14
                },
                crossOrigin: null
            }),
            legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map&service=WMS&request=GetLegendGraphic&layer=cti_rostenice&version=1.3.0&format=image/png&sld_version=1.1.0'],
            maxResolution: 8550,
            visible: false,
            opacity: 0.7
        }),
        new Tile({
            title: "Yield potential Rostenice",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map',
                params: {
                    LAYERS: 'yield_potential',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 14
                },
                crossOrigin: null
            }),
            legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map&service=WMS&request=GetLegendGraphic&layer=yield_potential&version=1.3.0&format=image/png&sld_version=1.1.0'],
            maxResolution: 8550,
            visible: true,
            opacity: 0.7
        }),
        new Tile({
            title: "Machinery tracklines",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map',
                params: {
                    LAYERS: 'machinery_tracklines_average_slope',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 14
                },
                crossOrigin: null
            }),
            legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map&service=WMS&request=GetLegendGraphic&layer=machinery_tracklines_average_slope&version=1.3.0&format=image/png&sld_version=1.1.0'],
            maxResolution: 8550,
            visible: true,
            opacity: 0.8
        })

    ],
    project_name: 'erra/map',
    datasources: [{
        title: "Services",
        url: "http://cat.ccss.cz/csw/",
        language: 'eng',
        type: "micka",
        code_list_url: 'http://www.whatstheplan.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
    }],
    hostname: {
        "default": {
            "title": "Default",
            "type": "default",
            "editable": false,
            "url": getHostname()
        }
    },
    'catalogue_url': "/php/metadata/csw",
    'compositions_catalogue_url': "/php/metadata/csw",
    panelsEnabled: {
        saveMap: false,
        compositions: true
    },
    allowAddExternalDatasets: true,
    status_manager_url: '/wwwlibs/statusmanager2/index.php',
    default_view: new View({
        center: transform([16.8290202, 49.0751890], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
        zoom: 15,
        units: "m"
    }),
    cesiumdDebugShowFramesPerSecond: true
});

module.controller('Main',
    function ($scope, $compile, HsCore, HsConfig, HsWeatherService, HsSidebarService, gettext, HsLayoutService) {
        'ngInject';
        $scope.Core = HsCore;
        HsConfig.default_layers.push(HsWeatherService.createLayer());
        $scope.panelVisible = HsLayoutService.panelVisible;
        
        $scope.$on('infopanel.updated', function (event) { });

        $scope.createAboutDialog = function () {
            var el = angular.element('<div hs.aboutproject></div>');
            HsLayoutService.contentWrapper.querySelector(".hs-dialog-area").appendChild(el[0]);
            $compile(el)($scope);
        }

        HsSidebarService.buttons.push({ panel: 'weather', module: 'hs.weather', order: 10, title: gettext('Weather watcher'), description: gettext('Get weather satellite crossings'), icon: 'icon-time' })
        
        $scope.$on("scope_loaded", function (event, args) {
            if (args == 'Sidebar') {
                var el = angular.element('<div hs.weather.directive hs.draggable ng-controller="hs.weather.controller" ng-if="Core.exists(\'hs.weather.controller\')" ng-show="panelVisible(\'weather\', this)"></div>')[0];
                HsLayoutService.panelListElement.appendChild(el);
                $compile(el)($scope);
            }
        })
    }
);
