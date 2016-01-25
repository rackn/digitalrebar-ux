/*
dialog controller
*/
(function(){
    angular.module('app').controller('DialogController', function ($scope, $rootScope, $mdDialog, locals, api, $mdToast) {
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

        this.addNodes = function(){
            var payload =  {
                description: "created by rebar",
                provider: locals.provider,
                hints: {
                    'use-proxy': false,
                    'use-ntp': false,
                    'use-dns': false,
                    'use-logging': false,
                    'provider-create-hint': { 
                    }
                }
            }
            if (locals.add_os != "default_os") {
                // packet
                payload.hints['provider-create-hint'].os = locals.add_os;
                // aws
                payload.hints['provider-create-hint'].image_id = locals.add_os;
                // google
                payload.hints['provider-create-hint'].disks = [];
                payload.hints['provider-create-hint'].disks.push({ 
                    'autoDelete': true,
                    'boot': true,
                    'type': 'PERSISTENT',
                    'initializeParams': {
                        'sourceImage': locals.add_os
                    }
                });
            };

            for(var i = 0; i < locals.number; i++) {
                payload.name = locals.base_name+"-"+i+"."+locals.provider+".neode.org",
                payload.hints['provider-create-hint'].hostname = locals.base_name+'-'+i

                api('/api/v2/nodes',{
                    method: "POST",
                    data: payload,
                }).error(function(err){
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Error: '+err.message)
                            .position('bottom left')
                            .hideDelay(3000)
                    );
                })
            }

            $mdToast.show(
                $mdToast.simple()
                    .textContent('Adding '+locals.number+' node'+(locals.number!=1?'s':''))
                    .position('bottom left')
                    .hideDelay(3000)
            );

            $mdDialog.hide();
        }

    });
})();