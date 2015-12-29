/*
dialog controller
*/
(function(){
    angular.module('app').controller('DialogController', ['$scope', '$rootScope', '$mdDialog', 'locals', function ($scope, $rootScope, $mdDialog, locals) {
        // keep locals from the config
        $scope.locals = locals;

        // have icons persist
        $scope.icons = $rootScope.icons;

        $scope.hide = function() {
            $mdDialog.hide();
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

    }]);
})();