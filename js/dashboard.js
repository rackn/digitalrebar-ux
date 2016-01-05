/*
dash controller
*/
(function(){
    angular.module('app').controller('DashCtrl', function($mdMedia, $mdDialog, $scope, $http, debounce, $timeout) {
        $scope.$emit('title', 'Dashboard'); // shows up on the top toolbar

        var dash = this;

        // when a node is clicked, this dialog appears (see nodedialog.tmpl.html)
        this.showNodeDialog = function(ev, node) {
            $scope.node = node;
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: 'DialogController',
                controllerAs: 'ctrl',
                templateUrl: 'nodedialog.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {
                    node: $scope.node
                },
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
        };

        // called when a deployment is clicked to 
        this.toggleExpand = function(deployment) {
            deployment.expand = !deployment.expand;
        }


        this.deploymentPie = {}
        this.deploymentStatus = {}

        // makes a map of node status => number of nodes with that status
        this.getNodeCounts = function(deployment, override) {
            var result = {};

            for(var id in deployment.nodes) {
                var node = deployment.nodes[id];

                if(!node.status)
                    continue;

                result[node.status] = (result[node.status] || 0) + 1;
            }
            return result
        }

        this.opts = { // sparkline options
            sliceColors: [
                "#8BC34A", 
                "#F44336",
                "#03A9F4",
                "#616161"
            ],
            tooltipFormat: '{{value}}',
            disableTooltips: true,
            disableHighlight: true,
            borderWidth: 2,
            borderColor: '#fff',
            width: '2em',
            height: '2em',
        };

        $scope.$on('nodesDone', function(){
            $scope.$evalAsync(function(){
                for(var id in $scope._deployments) {
                    dash.deploymentPie[id] = dash.getNodeCounts($scope._deployments[id]);
                }
            })
        })

        $scope.$on('node_rolesDone', function() {
            $scope.$evalAsync(function(){
                for(var id in $scope._deployments) {
                    var deployment = $scope._deployments[id];

                    dash.deploymentStatus[id] = {error: 0, total: 0}
                    for(var roleId in deployment.node_roles) {
                        var state = deployment.node_roles[roleId].state;
                        if(state == -1)
                            dash.deploymentStatus[id].error ++

                        dash.deploymentStatus[id].total ++; 
                    }
                }
            })
        })
        

    });

})();