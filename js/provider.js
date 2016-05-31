/*
provider controller
*/
(function(){
    angular.module('app')
    .controller('ProviderCtrl', function($scope, $location, $routeParams, api) {
        $scope.$emit('title', 'Provider'); // shows up on the top toolbar

        var provider = this;

        this.getProviders = function() {
            var providers = []
            for(var id in $scope._providers) {
                providers.push($scope._providers[id])
            }
            return providers
        }

        $scope.$on("keyDown", function(action, e){
            if(e.key == 13) { // enter
                $scope.startEditing()
            }
            if(e.key == 27) { // escape
                $scope.stopEditing()
            }
        })

        $scope.saveProvider = function() {
            if(!$scope.editing)
                return

            var data = angular.copy($scope.provider)
            api("/api/v2/providers/"+$scope.id,{
                method: "PUT",
                data: data
            }).
            success(api.addProvider).
            error(function(e){
                api.toast("Couldn't Save Provider", true)
            })
            $scope.stopEditing()
        }

        $scope.stopEditing = function() {
            if(!$scope.editing)
                return

            $scope.provider = $scope._providers[$scope.id];
            $scope.editing = false
        }

        $scope.startEditing = function() {
            if($scope.editing)
                return

            $scope.editing = true
            $scope.provider = angular.copy($scope._providers[$scope.id])
        }

        $scope.getNodes = function() {
            var nodes = []
            for(var id in $scope._nodes) {
                if($scope._nodes[id].provider_id == $scope.provider.id) {
                    nodes.push($scope._nodes[id])
                }
            }
            return nodes;
        }

        $scope.id = $routeParams.id
        $scope.provider = {}
        $scope.editing = false;
        var hasCallback = false;

        var updateProvider = function() { 
            if($scope.editing) return;
            
            $scope.provider = $scope._providers[$scope.id];
            if(!$scope.provider)
                $location.path('/providers')
            else if(!hasCallback) {
                hasCallback = true;
                $scope.$on('provider'+$scope.provider.id+"Done", updateProvider)
            }
        }

        if(Object.keys($scope._providers).length) {
            updateProvider()
        } else {
            $scope.$on('providersDone', updateProvider)
        }
    });
})();