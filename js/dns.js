/*
dns controller
*/
(function(){
    angular.module('app')
    .controller('DNSCtrl', function($scope, api, $mdDialog, $mdMedia) {
        $scope.$emit('title', 'DNS Zones'); // shows up on the top toolbar

        var dns = this;

        $scope.remove = function(zone, record) {
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
        }

    });
})();