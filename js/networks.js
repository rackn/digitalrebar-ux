/*
Copyright 2015, RackN
network controller
*/
(function(){
    angular.module('app').controller('NetworksCtrl', function($scope, api, $mdDialog, $mdMedia, $routeParams, $location) {
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

        $scope.assignNetworks = function(arr, deployment_id) {
            arr.forEach(function(network) {
                api("/api/v2/networks/"+network.id, {
                    method: "PUT",
                    data: {
                        deployment_id: deployment_id,
                    }
                }).success(api.addNetwork)
            })
        }

        $scope.delete = function(event) {
            $scope.confirm(event, {
                title: "Remove Network",
                message: "Are you sure you want to remove this network?",
                yesCallback: function(){
                    api('/api/v2/networks/'+$scope.id, {method: 'DELETE'}).
                        success(function(){
                            console.log("network deleted")
                        }).success(function(){
                            api.remove("network", $scope.id)
                            $location.path("/networks")
                        })
                }
            })
        }

        $scope.saveNetworkRanges = function() {
            if(!$scope.editingRanges)
                return

            var data = angular.copy($scope.ranges)
            Object.keys(data).forEach(function(id){
                var range = data[id]
                var original = $scope._ranges[id]
                console.log("ID: "+id)
                console.log(JSON.stringify(original) === JSON.stringify(range))
                if(JSON.stringify(range) === JSON.stringify(original))
                    return

                api("/api/v2/network_ranges/"+id,{
                    method: "PUT",
                    data: range
                }).
                success(function(obj){
                    $scope._ranges[obj.id] = obj
                    $scope.ranges[obj.id] = angular.copy(obj)
                }).
                error(function(e){
                    api.toast("Couldn't Save Network Range - "+e.message, 'network_ranges')
                })
                
            })
            $scope.stopEditingRanges()
        }

        $scope.deleteRange = function(id) {
            $scope.confirm(event, {
                title: "Remove Network Range",
                message: "Are you sure you want to remove network range " +$scope._ranges[id].name+"?",
                yesCallback: function(){
                    api('/api/v2/networks/'+$scope.id+'/network_ranges/'+id, {method: 'DELETE'}).
                    success(function(e){
                        delete $scope._ranges[id]
                        delete $scope.ranges[id]
                    })
                }
            })
        }

        $scope.addRange = function() {
            api("/api/v2/networks/"+$scope.id+"/network_ranges/", {
                method: "POST",
                data: {
                    network_id: $scope.id,
                    name: "Default",
                    first: "10.10.10.1/24",
                    last: "10.10.10.254/24"
                }
            }).
            success(function(obj){
                $scope._ranges[obj.id] = obj
                $scope.ranges[obj.id] = angular.copy(obj)
            }).
            error(function(e){
                api.toast("Couldn't Add Network Range - "+e.message, 'network_ranges')
            })
        }

        $scope.stopEditingRanges = function() {
            if(!$scope.editingRanges)
                return

            $scope.ranges = $scope._ranges;
            $scope.editingRanges = false
        }

        $scope.startEditingRanges = function() {
            if($scope.editingRanges)
                return

            $scope.editingRanges = true
            $scope.ranges = angular.copy($scope._ranges)
        }


        $scope.id = $routeParams.id
        $scope.network = {}
        $scope.hasRanges = -1;
        $scope.ranges = {};
        $scope._ranges = {};
        $scope.editing = false;
        $scope.editingRanges = false;
        var hasCallback = false;

        var updateNetwork = function() {
            if($scope.editing) return;

            $scope.network = $scope._networks[$scope.id];

            if(!$scope.network)
                $location.path('/networks')
            else {

                if($scope.hasRanges == -1) {
                    api('/api/v2/networks/'+$scope.network.id+"/network_ranges").
                    success(function(obj) {
                        obj.forEach(function(range){
                            $scope._ranges[range.id] = range 
                        })
                        $scope.ranges = angular.copy($scope._ranges)
                        $scope.hasRanges = 1;
                    }).
                    error(function() {
                        $scope.hasRanges = 0;
                    })
                }

                if(!hasCallback) {
                    hasCallback = true;
                    $scope.$on('network'+$scope.network.id+"Done", updateNetwork)
                }
            }

        }
        if(Object.keys($scope._networks).length) {
            updateNetwork()
        } else {
            $scope.$on('networksDone', function(){
                if(typeof $scope._networks[$scope.id] === 'undefined')
                    $location.path('/networks')
                else
                    updateNetwork()
            })
        }

    });

})();