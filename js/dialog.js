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

        this.updateBarclamp = function() {
            var config = $scope.locals.barclamp.cfg_data
            if(!config) {
                dialog.toast('Bad JSON')
                return
            }
            if(!config.barclamp.name) {
                dialog.toast('Name is required')
                return
            }
            var payload = {'value': config}
            api('/api/v2/barclamps', {
                method: 'POST',
                data: payload
            }).success(function(update){
                api('/api/v2/barclamps/'+$scope.locals.barclamp.id).
                    success(api.addBarclamp)
                dialog.toast('Updated barclamp')
            }).error(function(err){
                dialog.toast('Error: '+err.message)
            })

            $mdDialog.hide();
        }

        this.toast = function(message) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent(message)
                    .position('bottom left')
                    .hideDelay(3000)
            );
        }

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
                    dialog.toast('Error: '+err.message);
                })
            }

            dialog.toast('Adding '+locals.number+' node'+(locals.number!=1?'s':''));

            $mdDialog.hide();
        }

    });
})();