/*
node controller
*/
(function(){
    angular.module('app').controller('NodeCtrl', function($scope, $rootScope) {
        $rootScope.title = 'Nodes'; // shows up on the top toolbar

        this.selected = []
        this.order = 'name'
        this.limit = 50
        this.page = 1

        $rootScope.getDeployments()
        $rootScope.getProviders()

    });

})();