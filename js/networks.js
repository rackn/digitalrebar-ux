/*
Copyright 2015, RackN
network controller
*/
(function(){
    angular.module('app').controller('NetworkCtrl', function($scope) {
        $scope.$emit('title', 'Networks'); // shows up on the top toolbar

        var networks = this;
        this.selected = []
        this.order = 'name'

        this.getNetworks = function() {
        	var networks = []
        	for(var id in $scope._networks) {
        		networks.push($scope._networks[id])
        	}
        	return networks
        }

    });

})();