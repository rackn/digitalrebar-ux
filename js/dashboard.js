/*
dash controller
*/
(function(){
    angular.module('app').controller('DashCtrl', function($mdMedia, $mdDialog, $rootScope, $http, debounce, $timeout) {
        $rootScope.title = 'Dashboard'; // shows up on the top toolbar

        var dash = this;

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


        this.deployRes = {}

        // makes a map of node status => number of nodes with that status
        this.getNodeCounts = function(deployment, override) {
            var result = {};
            console.log("Getting node counts")

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

        $rootScope.getDeployments().success(function(data){
            console.log("finished deployments")
            $rootScope.getNodes().success(function(){
                $rootScope.$evalAsync(function(){
                    for(var i in data) {
                        var id = data[i].id
                        console.log("node counts "+id)
                        dash.deployRes[id] = dash.getNodeCounts($rootScope._deployments[id]);
                    }
                })
            })
        })
        

    });

})();