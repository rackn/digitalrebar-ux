/*
logging controller
*/
(function () {
  angular.module('app')
    .controller('LoggingCtrl', function ($scope, api, $mdDialog, $mdMedia, localStorageService) {
      $scope.$emit('title', 'Error Logging'); // shows up on the top toolbar

      $scope.query = {
        page: 1,
        limit: 10,
      };

      $scope.showInfo = function (ev, err) {
         $mdDialog.show({
          template: 
            '<md-dialog aria-label="Error">' +
            '  <md-toolbar>' +
            '    <div class="md-toolbar-tools">' +
            '      <h2>' + err.type + " - " + err.message + '</h2>' +
            '    </div>' +
            '  </md-toolbar>' +
            '  <md-dialog-content>' +
            '    <div class="md-dialog-content">' +
            '      <b>Error:&nbsp;</b>' +
            '      <pre>' + JSON.stringify(err.err, null, "  ") + '</pre>' +
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
    });
})();
