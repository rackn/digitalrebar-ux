/*
dash controller
*/
(function(){
    angular.module('app').controller('DashCtrl', ['$mdMedia', '$mdDialog', '$rootScope', '$http', function($mdMedia, $mdDialog, $rootScope, $http) {
        $rootScope.title = 'Dashboard'; // shows up on the top toolbar

        var dash = this;
        this.deployments = {};

        // when a node is clicked, this dialog appears (see nodedialog.tmpl.html)
        this.showNodeDialog = function(ev, node) {
            console.log(node);
            $rootScope.node = node;
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: 'DialogController',
                controllerAs: 'ctrl',
                templateUrl: 'nodedialog.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {
                    node: $rootScope.node
                },
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
        };

        // called when a deployment is clicked to 
        this.toggleExpand = function(deployment) {
            deployment.expand = !deployment.expand;
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

        this.getDeployments = function() {
            $rootScope.callApi('/api/v2/deployments').
                success(function(data){
                    dash.deployments = {}
                    for(var i in data) {
                        var deployment = data[i]
                        var id = deployment.id
                        dash.deployments[id] = deployment
                        dash.deployments[id].nodes = {
                            'ready': 0,
                            'error': 0,
                            'working': 0,
                            'off': 0
                        }
                        dash.deployments[id].data = {nodes: [], roles: []}
                    }
                    dash.getNodes();
                }).error(function(resp){

                })
        }

        this.getNodes = function() {
            $rootScope.callApi('/api/v2/nodes').
                success(function(data){
                    for(var i in data) {
                        var node = data[i]
                        var state = 'ready'
                        if(!node.alive)
                            state = 'off'

                        var deployment = dash.deployments[node.deployment_id]
                        if(node.deployment_id == deployment.id) {
                            deployment.data.nodes.push(node)
                            deployment.nodes[state] ++
                        }
                    }
                }).
                error(function(resp){

                })
        }

        this.getDeploymentRoles = function() {
            $rootScope.callApi('/api/v2/deployment_roles').
                success(function(data){
                    for(var i in data) {
                        var role = data[i]

                        for(var j in dash.deployments) {
                            var deployment = dash.deployment[j]
                            if(node.deployment_id == deployment.id) {
                                deployment.data.roles.push(node)
                            }
                        }
                    }
                }).
                error(function(resp){

                })
        }

        this.getNodeRoles = function(id) {
            $rootScope.callApi('/api/v2/nodes/'+id+'/node_roles').
            success(function(data){

            }).
            error(function(resp){

            })
        }

        this.getDeployments();

    }]);

})();