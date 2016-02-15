/*
deployments controller
*/
(function(){
    angular.module('app').controller('DeploymentsCtrl', function($mdMedia, $mdDialog, $scope, $http, debounce, $timeout, $routeParams) {
        $scope.$emit('title', 'Deployments'); // shows up on the top toolbar

        var deployments = this;

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

        $scope.expand = {}

        if($routeParams.id)
            $scope.expand[$routeParams.id] = true;

        // called when a deployment is clicked
        this.toggleExpand = function(deployment) {
            $scope.expand[deployment.id] = !$scope.expand[deployment.id];
        }


        // makes a map of node simpleState => number of nodes with that simpleState
        this.getNodeCounts = function(deployment, override) {
            var result = [0, 0, 0, 0];

            for(var i in $scope._nodes) {
                var node = $scope._nodes[i];
                if (node.deployment_id == deployment.id && !node.system) 
                    result[node.simpleState] ++;
            }
            return result
        }

        this.opts = { // sparkline options
            sliceColors: [
                "#8BC34A", // ready
                "#F44336", // error
                "#03A9F4", // todo
                "#616161" // off
            ],
            tooltipFormat: '{{value}}',
            disableTooltips: true,
            disableHighlight: true,
            borderWidth: 2,
            borderColor: '#fff',
            width: '2em',
            height: '2em',
        };

        this.deploymentPie = {}

        // creates the pie chart data for all the deployments
        this.createPieChartData = function() {
            $timeout(function(){
                for(var id in $scope._deployments) {
                    deployments.deploymentPie[id] = deployments.getNodeCounts($scope._deployments[id]);
                }
            }, 500)
        }

        this.deploymentStatus = {}

        // creates the node role status data for all the deployments
        // takes a sum of the all the node roles and all the errors
        this.createStatusBarData = function() {
            $scope.$evalAsync(function(){
                for(var id in $scope._deployments) {
                    var deployment = $scope._deployments[id];
                    deployments.deploymentStatus[id] = {error: 0, total: 0}
                    for(var roleId in deployment.node_roles) {
                        var state = deployment.node_roles[roleId].state;
                        if(state == -1)
                            deployments.deploymentStatus[id].error ++

                        deployments.deploymentStatus[id].total ++; 
                    }
                }
            })
        }

        // callbacks for when nodes and noderoles finish
        // the pie charts require the nodes to exist
        $scope.$on('nodesDone', deployments.createPieChartData)
        $scope.$on('node_rolesDone', deployments.createStatusBarData)

        // if we have nodes, we don't have to wait for the callback
        if(Object.keys($scope._nodes).length)
            this.createPieChartData();

        if(Object.keys($scope._node_roles).length)
            this.createStatusBarData();
        

    });

})();