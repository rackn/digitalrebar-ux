/*
  Copyright 2017, RackN
  Logging Controller
*/
(function () {
  angular.module('app')
    .controller('LoggingCtrl', [
      '$scope', 'api', '$mdDialog', '$mdMedia', 'localStorageService',
      function ($scope, api, $mdDialog, $mdMedia, localStorageService) {
        $scope.$emit('title', 'Alert History'); // shows up on the top toolbar

        $scope.query = {
          page: 1,
          limit: 10,
        };

        $scope.showInfo = function (ev, err) {
          $mdDialog.show({
            template: '' +
              '<md-dialog aria-label="Error">' +
              '  <md-toolbar>' +
              '    <div class="md-toolbar-tools">' +
              '      <h2>' + err.type + ' - ' + err.message + '</h2>' +
              '    </div>' +
              '  </md-toolbar>' +
              '  <md-dialog-content>' +
              '    <div class="md-dialog-content">' +
              '      <b>Error:&nbsp;</b>' +
              '      <pre>' + JSON.stringify(err.err, null, '  ') + '</pre>' +
              '      <b>Stack:</b>' +
              '      <pre>' + err.stack + '</pre>' +
              '    </div>' +
              '  </md-dialog-content>' +
              '</md-dialog>',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
          });
        };

        $scope.remove = function (err) {
          api.errors.splice(api.errors.indexOf(err), 1);
          localStorageService.add('errors', api.errors);
        };

        $scope.method = 'get';
        $scope.payload = '{}';
        $scope.route = '';
        $scope.class = {};

        $scope.parse = function (data) {
          try {
            return JSON.parse(data);
          } catch (e) {
            return false;
          }
        };

        $scope.testApi = function () {
          api($scope.route, {method: $scope.method, data: JSON.parse($scope.payload)}).
          then(function (resp) {
            $scope.class = {success: true};
            $scope.output = JSON.stringify(resp.data, null, '  ');
          }, function (err) {
            $scope.class = {error: true};
            $scope.output = JSON.stringify(err && err.data || err, null, '  ') || err.data;
          });
        };

        $scope.clearOutput = function () {
          $scope.output = '';
          $scope.class = {};
        };
      }
    ]);
})();
