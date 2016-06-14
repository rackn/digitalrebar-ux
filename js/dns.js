/*
dns controller
*/
(function(){
    angular.module('app')
    .controller('DNSCtrl', function($scope, api, $mdDialog, $mdMedia) {
        $scope.$emit('title', 'DNS Zones'); // shows up on the top toolbar

        var dns = this;
        this.selected = []

        $scope.deleteRecords = function(zone) {
            $scope.confirm(event, {
                title: "Remove Records",
                message: "Are you sure you want to remove selected records?",
                yesCallback: function(){
                    dns.selected.forEach(function(record){                    
                        record.changetype = 'REMOVE'
                        api('/dns/zones/'+zone.name, {
                            method: 'PATCH',
                            data: record
                        }).success(function(data){
                            api.getHealth()     
                        }).error(function(){
                            api.getHealth()
                        })
                    })
                    
                    dns.selected = []
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
        }

    });
})();