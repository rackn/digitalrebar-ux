/*
provider controller
*/
(function(){
    angular.module('app')
    .controller('ProviderCtrl', function($scope, $location, $routeParams) {
        $scope.$emit('title', 'Provider'); // shows up on the top toolbar

        var provider = this;

        this.getProviders = function() {
            var providers = []
            for(var id in $scope._providers) {
                providers.push($scope._providers[id])
            }
            return providers
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

        // if an id is passed, we will assume we're looking at a provider
        if($routeParams.id) {
            $scope.provider = {}
            
            $scope.$watch('_providers['+$routeParams.id+']', function(provider){
                $scope.provider = provider
            })
            
        }
    });
})();