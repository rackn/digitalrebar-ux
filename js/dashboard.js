/*
dash controller
*/
(function(){
    angular.module('app').controller('DashCtrl', ['$mdMedia', '$mdDialog', '$rootScope', '$http', function($mdMedia, $mdDialog, $rootScope, $http) {
        $rootScope.title = 'Dashboard'; // shows up on the top toolbar

        var dash = this;
        this.deployments = [];

        // when a node is clicked, this dialog appears (see nodedialog.tmpl.html)
        this.showNodeDialog = function(ev, node) {
            console.log(node);
            $rootScope.node = node;
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
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
            if(deployment.expand) {
                $http.get('/example_deployment.json').
                    success(function(data){
                        deployment.data = data.deployment;
                        console.log("Update")
                    }).
                    error(function(){
                        console.log('No data!')
                    })
            }
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

        $http.get('/example_dashboard.json').
            success(function(data){
                dash.deployments = data.deployments;
                for(var i in dash.deployments) {
                    dash.deployments[i].data = {}
                }
            }).
            error(function(){

            })

    }]);

})();