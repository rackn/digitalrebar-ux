/*
dhcp controller
*/
(function(){
    angular.module('app')
    .controller('DHCPCtrl', function($scope, api, $mdDialog, $mdMedia) {
        $scope.$emit('title', 'DHCP Subnets'); // shows up on the top toolbar

        var dhcp = this;

    });
})();