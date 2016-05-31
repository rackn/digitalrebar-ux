/*
Copyright 2015, RackN
network controller
*/
(function(){
    angular.module('app').controller('NetworkCtrl', function($scope, api, $mdDialog, $mdMedia) {
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

        this.deleteSelected = function(event) {
            $scope.confirm(event, {
                title: "Remove Networks",
                message: "Are you sure you want to remove selected networks?",
                yesCallback: function(){
                    networks.selected.forEach(function(network) {

                        // the api call uses REST DELETE on /nodes/id to remove a node 
                        api('/api/v2/networks/'+network.id, {method: 'DELETE'}).
                            success(function(){
                                console.log("network deleted")
                            }).success(function(){
                                api.remove("network", network.id)
                            })
                    })

                    // remove the selected items
                    networks.selected = []
                }
            })
        }

    });

})();