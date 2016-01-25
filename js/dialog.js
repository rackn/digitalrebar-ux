/*
dialog controller
*/
(function(){
    angular.module('app').controller('DialogController', ['$scope', '$rootScope', '$mdDialog', 'locals', function ($scope, $rootScope, $mdDialog, locals) {
        // keep locals from the config
        var dialog = this;
        $scope.locals = locals;

        // have icons persist
        $scope.icons = $rootScope.icons;

        $scope.providers = (function(){
            var providers = []
            for(var id in locals.providers) {
                var provider = locals.providers[id]
                if(Object.keys(provider.auth_details).length)
                    providers.push(provider)
            }
            return providers;
        })();

        $scope.hide = function() {
            $mdDialog.hide();
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.$watch('locals', function(locals){
            var payload =  {
                description: "created by rebar",
                name: locals.base_name+"-X."+locals.provider+".neode.org",
                provider: locals.provider,
                hints: {
                    'use-proxy': false,
                    'use-ntp': false,
                    'use-dns': false,
                    'use-logging': false,
                    'provider-create-hint': { 
                        'hostname': locals.base_name+"-X"
                    }
                }
            }
            if (locals.add_os != "default_os") {
                // packet
                payload.hints['provider-create-hint'].os = add_os;
                // aws
                payload.hints['provider-create-hint'].image_id = add_os;
                // google
                payload.hints['provider-create-hint'].disks = [];
                payload.hints['provider-create-hint'].disks.push({ 
                    'autoDelete': true,
                    'boot': true,
                    'type': 'PERSISTENT',
                    'initializeParams': {
                        'sourceImage': add_os
                    }
                });
            };
            dialog.payload = payload;
            console.log(dialog.payload)
        })

    }]);
})();