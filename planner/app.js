'use strict';
import 'toolbar.module';
import 'print.module';
import 'query.module';
import 'search.module';
import 'add-layers.module';
import 'measure.module';
import 'permalink.module';
import 'info.module';
import 'datasource-selector.module';
import 'sidebar.module';
import 'draw.module';
import 'add-layers.module';
import { Tile, Vector as VectorLayer, Group, Image as ImageLayer } from 'ol/layer';
import { TileWMS, Vector as VectorSource, WMTS, OSM, XYZ } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import { transform, transformExtent } from 'ol/proj';
import 'feature-filter.module';
import 'angular-material';

var module = angular.module('hs', [
    'hs.toolbar',
    'hs.layermanager',
    'hs.map',
    'hs.query',
     'ngMaterial',
    'hs.search', 'hs.print', 'hs.permalink', 'hs.measure',
    'hs.legend', 'hs.geolocation', 'hs.core',
    'hs.addLayers',
    'hs.featureFilter',
    'gettext',
    'hs.compositions', 'hs.save-map',
    'hs.sidebar'
]);

module.directive('hs', ['config', 'Core', function (config, Core) {
    return {
        template: Core.hslayersNgTemplate,
        link: function (scope, element) {
            Core.fullScreenMap(element);
        }
    };
}]);

var caturl = "/php/metadata/csw/index.php";

module.value('config', {
    design: 'md',
    box_layers: [
        new Group({
            title: 'Podkladové mapy',
            layers: [
                new Tile({
                    source: new OSM(),
                    title: "Base layer",
                    base: true,
                    removable: false
                }),
                new VectorLayer({
                    title: "Parcely LPIS",
                    source: new VectorSource({
                        format: new GeoJSON(),
                        url: 'plots.geojson',
                    }),
                    hsFilters: [
                        {
                            title: "Plodina",
                            valueField: "PLODINA_AK",
                            type: {
                                type: "fieldset",
                            },
                            selected: undefined,
                            values: [],
                            gatherValues: true
                        },
                        {
                            title: "Výměra",
                            valueField: "VYMERA",
                            type: {
                                type: "slider",
                                parameters: "ge",
                            },
                            range: [0],
                            unit: "ha",
                            gatherValues: true,
                        }
                    ]
                })
            ],
        }),
    ],
    //project_name: 'hslayers',
    project_name: 'Material',
    default_view: new View({
        center: transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
        zoom: 5,
        units: "m"
    }),
    social_hashtag: 'via @opentnet',

    compositions_catalogue_url: '/php/catalogue/libs/cswclient/cswClientRun.php',
    status_manager_url: '/wwwlibs/statusmanager2/index.php',
    datasources: [{
        title: "SuperCAT",
        url: "http://cat.ccss.cz/csw/",
        language: 'eng',
        type: "micka",
        code_list_url: '/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
    }]
});

module.controller('Main', ['$scope', 'Core', 'config', 'hs.layout.service',
    function ($scope, Core, config, layoutService) {
        $scope.Core = Core;
        layoutService.sidebarRight = false;
        Core.singleDatasources = true;
    }
]);
