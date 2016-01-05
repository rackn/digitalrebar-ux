/*
Copyright 2015, RackN
network controller
*/
(function(){
    angular.module('app').controller('NetworkCtrl', function($scope, $rootScope) {
        $rootScope.title = 'Networks'; // shows up on the top toolbar

        var networks = this;
        this.selected = []
        this.order = 'name'

        $rootScope.getDeployments()

        this.getNetworks = function() {
        	var networks = []
        	for(var id in $rootScope._networks) {
        		networks.push($rootScope._networks[id])
        	}
        	return networks
        }

    });

})();