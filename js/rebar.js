(function(){

var app = angular.module('app');

app.filter('from', function() {
    return function(items, type, obj) {
        // _node | from:'deployment':deployment
        // gets all nodes with deployment_id == deployment.id
        var id = obj.id
        var result = [];
        angular.forEach(items, function(value, key) {
            if(value[type+"_id"] == id)
                result.push(value);
        });
        return result;
    };
});

app.run(function($rootScope, $cookies, api, $interval){
    // use regex to get the current location
    var currentLocation = /https:\/\/[^:\/]+/.exec(location.href)[0];
    $rootScope.host = $cookies.get('host') || currentLocation+':3000';

    $rootScope.$on('updateApi', function(event) {
        // make the api calls and add callbacks
        console.log("Making api calls")

        api.getDeployments().
            success(function(){
                $rootScope.$broadcast('deploymentsDone')

                api.getNodes().
                    success(function(){
                        $rootScope.$broadcast('nodesDone')

                        api.getNodeRoles().
                            success(function(){
                                $rootScope.$broadcast('node_rolesDone')
                            })
                    })

                api.getRoles().
                    success(function(){
                        $rootScope.$broadcast('rolesDone')

                        api.getDeploymentRoles().
                            success(function(){
                                $rootScope.$broadcast('deployment_rolesDone')
                            })
                    })


                api.getNetworks().
                    success(function(){
                        $rootScope.$broadcast('networksDone')
                    })
            })
        ;
        api.getProviders().
            success(function(){
                $rootScope.$broadcast('providersDone')
            })
    })

    $rootScope.$on('startUpdating', function(event){
        $rootScope.$emit('updateApi')

        $interval(function(){
            console.log("telling update")
            $rootScope.$emit('updateApi')
        }, 3 * 60 * 1000 /* 3 minutes */ )
    })

    $rootScope.tryFetch = function() {
        $rootScope.$emit('updateApi')
    }

    console.log('Starting rebar')
    $rootScope._deployments = {}
    $rootScope._deployment_roles = {}
    $rootScope._roles = {}
    $rootScope._nodes = {}
    $rootScope._networks = {}
    $rootScope._node_roles = {}
    $rootScope._providers = {}

})

app.factory('api', function($http, $rootScope) {


    // function for calling api functions ( eg. /api/v2/nodes )
    // to use:
    // api('/path/to/api', {data: {asdf}, method: 'GET'}).success(function(data){}).error(function(data){})
    var api = function(path, args) {
        args = args || {};
        args.method = args.method || 'GET';
        args.headers = args.headers || {}
        args.api = true;
        args.url = $rootScope.host+path;
        return $http(args)
    }

    api.addDeployment = function(deployment) {
        var id = deployment.id
        $rootScope._deployments[id] = deployment
    }

    api.getDeployments = function() {
        return api('/api/v2/deployments').
            success(function(data){
                data.map(api.addDeployment)
            })
    }

    api.addNode = function(node) {
        var id = node.id
        
        node.address = node['node-control-address']

        var state = $rootScope.states[node.state]
        if(!node.alive)
            state = 'off'
        node.status = state

        // assign simple states for the dashboard pie chart
        if(!node.alive)
            node.simpleState = 3; //off
        else {
            node.simpleState = 2; // todo
            if(node.state == -1)
                node.simpleState = 1; // error
            if(node.state == 0)
                node.simpleState = 0; // ready
        }

        $rootScope._nodes[id] = node
    }

    // api call for getting all the nodes
    api.getNodes = function() {
        return api('/api/v2/nodes').
            success(function(data){
                data.map(api.addNode)
            })
    }

    api.addRole = function(role) {
        var id = role.id
        $rootScope._roles[id] = role
    }

    // api call for getting all the roles
    api.getRoles = function() {
        return api('/api/v2/roles').
            success(function(data){
                data.map(api.addRole)
            })
    }

    api.addDeploymentRole = function(role) {
        role.cohort = $rootScope._roles[role.role_id].cohort
        $rootScope._deployment_roles[role.id] = role
    }

    // api call for getting all the deployment roles
    api.getDeploymentRoles = function() {
        return api('/api/v2/deployment_roles').
            success(function(data){
                data.map(api.addDeploymentRole)
            })
    }

    api.addProvider = function(provider) {
        var id = provider.id
        $rootScope._providers[id] = provider
    }

    // api call for getting all the providers
    api.getProviders = function() {
        return api('/api/v2/providers').
            success(function(data){
                data.map(api.addProvider)
            })
    }

    api.addNetwork = function(network) {
        var id = network.id
        $rootScope._networks[id] = network
    }

    // api call for getting all the providers
    api.getNetworks = function() {
        return api('/api/v2/networks').
            success(function(data){
                data.map(api.addNetwork)
            })
    }

    api.addNodeRole = function(role) {
        var id = role.id

        $rootScope._node_roles[id] = role

        role.status = $rootScope.states[role.state]
    }

    // api call for getting all the node roles
    api.getNodeRoles = function() {
        return api('/api/v2/node_roles?runlog').
            success(function(data){
                data.map(api.addNetwork)
            })
    }

    return api;
    
})

})();