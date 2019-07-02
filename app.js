'use strict';
import toolbar from 'toolbar';
import print from 'print';
import query from 'query';
import search from 'search';
import measure from 'measure';
import permalink from 'permalink';
import 'hscesium';
import info from 'info';
import ds from 'datasource_selector';
import sidebar from 'sidebar';
import 'add-layers.module';
import bootstrapBundle from 'bootstrap/dist/js/bootstrap.bundle';
import { Tile, Group } from 'ol/layer';
import { TileWMS, WMTS, OSM, XYZ } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import View from 'ol/View';
import { transform, transformExtent } from 'ol/proj';
import 'cesium/Build/Cesium/Widgets/widgets.css';

var module = angular.module('hs', [
    'hs.toolbar',
    'hs.layermanager',
    'hs.query',
    'hs.search', 'hs.print', 'hs.permalink',
    'hs.datasource_selector',
    'hs.geolocation',
    'hs.cesium',
    'hs.sidebar',
    'hs.addLayers'
]);

module.directive('hs', ['hs.map.service', 'Core', '$compile', '$timeout', function (OlMap, Core, $compile, $timeout) {
    return {
        template: Core.hslayersNgTemplate,
        link: function (scope, element) {
            $timeout(function () {
                Core.fullScreenMap(element);
                scope.createAboutDialog();
            }, 0);
        }
    };
}]);

module.directive('hs.aboutproject', function () {
    function link(scope, element, attrs) {
       scope.aboutVisible = true;
    }
    return {
        template: require('./about.html'),
        link: link
    };
});

function getHostname() {
    var url = window.location.href
    var urlArr = url.split("/");
    var domain = urlArr[2];
    return urlArr[0] + "//" + domain;
};

module.value('config', {
    cesiumBase: './node_modules/cesium/Build/Cesium/',
    cesiumAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDk3ZmM0Mi01ZGFjLTRmYjQtYmFkNC02NTUwOTFhZjNlZjMiLCJpZCI6MTE2MSwiaWF0IjoxNTI3MTYxOTc5fQ.tOVBzBJjR3mwO3osvDVB_RwxyLX7W-emymTOkfz6yGA',
    newTerrainProviderOptions: {
        url: 'http://gis.lesprojekt.cz/cts/tilesets/rostenice_dmp1g/'
    },
    terrain_providers: [{
        title: 'Local surface model',
        url: 'http://gis.lesprojekt.cz/cts/tilesets/rostenice_dmp1g/',
        active: true
    }, {
        title: 'Local terrain model',
        url: 'http://gis.lesprojekt.cz/cts/tilesets/rostenice_dmr5g/',
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
        title: "Datasets",
        url: "http://otn-dev.intrasoft-intl.com/otnServices-1.0/platform/ckanservices/datasets",
        language: 'eng',
        type: "ckan",
        download: true
    }, {
        title: "Services",
        url: "http://cat.ccss.cz/csw/",
        language: 'eng',
        type: "micka",
        code_list_url: 'http://www.whatstheplan.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
    }, {
        title: "Hub layers",
        url: "http://opentnet.eu/php/metadata/csw/",
        language: 'eng',
        type: "micka",
        code_list_url: 'http://opentnet.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
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
    status_manager_url: '/wwwlibs/statusmanager2/index.php',
    default_view: new View({
        center: transform([16.8290202, 49.0751890], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
        zoom: 15,
        units: "m"
    })
});

module.controller('Main', ['$scope', '$compile', '$element', 'Core', 'hs.map.service', 'config',
    function ($scope, $compile, $element, Core, OlMap, config) {
        $scope.hsl_path = hsl_path; //Get this from hslayers.js file
        $scope.Core = Core;

        Core.singleDatasources = true;
        Core.panelEnabled('compositions', true);
        Core.panelEnabled('status_creator', false);

        $scope.$on('infopanel.updated', function (event) { });

        $scope.createAboutDialog = function () {
            var el = angular.element('<div hs.aboutproject></div>');
            document.getElementById("hs-dialog-area").appendChild(el[0]);
            $compile(el)($scope);
        }
    }
]);
