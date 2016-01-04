/*
node controller
*/
(function(){
    angular.module('app').controller('NodeCtrl', function($rootScope) {
        $rootScope.title = 'Nodes'; // shows up on the top toolbar

        this.selected = []
        this.order = 'name'
        this.limit = 50
        this.page = 1

        var nodes = this;
        this.nodes = [];
        this.deployments = {};

        this.getDeployments = function() {
            $rootScope.callApi('/api/v2/deployments').
                success(function(data){
                    nodes.deployments = {}
                    for(var i in data) {
                        var deployment = data[i]
                        var id = deployment.id
                        nodes.deployments[id] = deployment
                    }
                    nodes.getNodes();
                }).error(function(resp){

                })
        }

        this.getNodes = function() {
            $rootScope.callApi('/api/v2/nodes').
                success(function(data){
                    nodes.nodes = data
                }).
                error(function(resp){
                })
        }

        this.getDeployments();

    });

})();