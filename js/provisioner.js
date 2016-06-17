/*
provisioner controller
*/
(function(){
    angular.module('app')
    .controller('ProvisionerCtrl', function($scope, api, $location, $mdDialog, $mdMedia, $routeParams) {
        
        // use the same controller for 3 pages, so handle the title for each location
        var route = $location.path().split("/")[2]
        var title = 'Provisioner '
        switch(route){
        case 'bootenvs':
            title += 'Boot Environments'
            break
        case 'templates':
            title += 'Templates'
            break
        case 'machines':
            title += 'Machines'
            break
        }
        $scope.$emit('title', title);

        var provisioner = this;
        
        $scope.expand = {}
        
        var mapNodes = function() {
            $scope.nodeMap = {}

            for(var id in $scope._nodes) {
                var node = $scope._nodes[id]
                $scope.nodeMap[node.name] = node
            }

        }
        mapNodes()

        $scope.$on('nodesDone', mapNodes)

        if($routeParams.id)
            $scope.expand[$routeParams.id] = true;

        /*$scope.remove = function(zone, record) {
            $scope.confirm(event, {
                title: "Remove Record",
                message: "Are you sure you want to remove this record?",
                yesCallback: function(){
                    var index = zone.records.indexOf(record)
                    record.changetype = 'REMOVE'
                    api('/dns/zones/'+zone.name, {
                        method: 'PATCH',
                        data: record
                    }).success(function(data){
                        api.getHealth()     
                    }).error(function(){
                        api.getHealth()
                    })
                }
            })
        }

        $scope.add = function(ev, zone) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: 'DialogController',
                controllerAs: 'dialog',
                templateUrl: 'views/dialogs/adddnsrecorddialog.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {
                    zone: zone,
                    record: {
                        changetype: "ADD",
                        name: "",
                        content: "",
                        type: ""
                    }

                },
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
        }*/

    });
})();