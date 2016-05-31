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

        this.showAddNetworkDialog = function(ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: 'DialogController',
                controllerAs: 'dialog',
                templateUrl: 'views/dialogs/addnetworkdialog.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {
                    network: {
                        name: "",
                        description: "",
                        category: "general",
                        group: "default",
                        deployment_id: 1,
                        vlan: -1,
                        v6prefix: "auto",
                        bridge: -1,
                        team_mode: -1,
                        conduit: "10g1",
                        pbr: null
                    },
                    _deployments: $scope._deployments
                },
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
        };

    });

})();