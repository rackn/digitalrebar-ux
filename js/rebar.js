(function(){

// capitalize function
function capitalize(txt){
    return txt.charAt(0).toUpperCase() +
        txt.substr(1).toLowerCase();
}

// converts under_score to CamelCase
function camelCase(name) {
    return name.split("_").map(capitalize).join("")
}

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

        // loops through 'fetch', calling api.getDeployments 
        //      and emitting the proper callback (deploymentsDone)
        app.types.forEach(function(name){
            api["get"+camelCase(name)]().success(function(){
                $rootScope.$broadcast(name+'Done')
            })
        })
    })

    $rootScope.$on('startUpdating', function(event){
        api.reload()
        api.getActive();

    })

    $rootScope.tryFetch = function() {
        $rootScope.$emit('updateApi')
    }


    $rootScope._deployments = {}
    $rootScope._deployment_roles = {}
    $rootScope._roles = {}
    $rootScope._nodes = {}
    $rootScope._networks = {}
    $rootScope._node_roles = {}
    $rootScope._providers = {}
    $rootScope._barclamps = {}

})

app.factory('api', function($http, $rootScope, $timeout, $mdToast, debounce) {


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

    app.types = ['deployments', 'roles', 'nodes', 'node_roles',
        'deployment_roles', 'networks', 'providers', 'barclamps']


    api.lastUpdate = new Date().getTime();
    api.queue = []

    api.errors = []

    api.toast = function(message, error) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .position('bottom left')
                .hideDelay(3000)
        );
        if(error) {
            api.errors.push({type: error, message: message})
        }
    }

    api.fetch = function(name, id) {
        return api("/api/v2/"+name+"s/"+id).
            success(function(obj){
                api["add"+camelCase(name)](obj);
            }).
            error(function(err){
                api.remove(name, id)
            })
    }

    api.reload = function() {
        $rootScope.$emit('updateApi')
        api.lastUpdate = new Date().getTime();
        debounce(api.reload, 3 * 60 * 1000, false)()
    }


    // add an api call to the queue
    api.addQueue = function(name, id) {
        api.queue.push(function(){
            api.fetch(name, id).
                success(api.nextQueue).
                error(api.nextQueue)
        });
    }

    api.nextQueue = function() {
        // if the queue isn't empty
        if(api.queue.length) {
            // eval and remove the first one
            $rootScope.$evalAsync(
                api.queue.splice(0, 1)[0]
            )
        } else { // queue is empty, wait and populate it
            $timeout(api.getActive, 15 * 1000 /* 15 seconds */ )
        }
    }

    api.getActive = function() {
        // time since last update in seconds
        var deltaTime = Math.ceil((new Date().getTime() - api.lastUpdate)/1000)

        api('/api/status/active', {
            method: 'PUT',
            params: {
                "age": deltaTime
            },
            data: { // sending only the IDs of nodes and deployments
                "nodes": Object.keys($rootScope._nodes).map(Number),
                "deployments": Object.keys($rootScope._deployments).map(Number)
            }
        }).success(function(data){
            api.lastUpdate = new Date().getTime();
            for(var type in data.changed) {
                // using forEach for asynchronous api calls
                data.changed[type].forEach(function(id) {
                    // remove the plural from the type (nodes -> node)
                    var name = /^.*(?=s)/.exec(type)[0]
                    api.addQueue(name, id)
                });
            }

            for(var type in data.deleted) {
                for(var i in data.deleted[type]) {
                    var id = data.deleted[type][i]
                    var name = /^.*(?=s)/.exec(type)[0]
                    try {
                        api.remove(name, id)
                    } catch (e) {
                        console.warn(e)
                    }
                }
            }

            // start the queue
            api.nextQueue()
        }).error(function(resp) {
            console.warn(resp)
            api.nextQueue()
        })
    }

    api.remove = function(type, parentId) {
        if(typeof parentId === 'undefined')
            return;

        if(!$rootScope['_'+type+'s'][parentId])
            return;

        console.log('removing '+type+' '+parentId)
        delete $rootScope['_'+type+'s'][parentId];

        if(type == 'deployment') {
            ['nodes', 'node_roles'].forEach(function(item){
                var removed = []
                var name = /^.*(?=s)/.exec(item)[0]
                for(var id in $rootScope['_'+item]){
                    var child = $rootScope['_'+item][id];
                    if(child.deployment_id == parentId)
                        api.addQueue(name, id)
                }
            })
        }

    }


    api.addDeployment = function(deployment) {
        var id = deployment.id
        $rootScope._deployments[id] = deployment
        $rootScope.$broadcast("deployment"+id+"Done")
    }

    api.getDeployments = function() {
        return api('/api/v2/deployments').
            success(function(data){
                $rootScope._deployments = {}
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

        $rootScope.$broadcast("node"+id+"Done")
        $rootScope._nodes[id] = node
    }

    // api call for getting all the nodes
    api.getNodes = function() {
        return api('/api/v2/nodes').
            success(function(data){
                $rootScope._nodes = {}
                data.map(api.addNode)
            })
    }

    api.addRole = function(role) {
        var id = role.id
        $rootScope._roles[id] = role
        $rootScope.$broadcast("role"+id+"Done")
    }

    // api call for getting all the roles
    api.getRoles = function() {
        return api('/api/v2/roles').
            success(function(data){
                $rootScope._roles = {}
                data.map(api.addRole)
            })
    }

    api.addDeploymentRole = function(role) {
        // allow deployment roles to be sorted by cohort
        role.cohort = function(){
            $rootScope._roles[role.role_id].cohort
        }
        var id = role.id
        $rootScope._deployment_roles[id] = role
        $rootScope.$broadcast("deployment_role"+id+"Done")
    }

    // api call for getting all the deployment roles
    api.getDeploymentRoles = function() {
        return api('/api/v2/deployment_roles').
            success(function(data){
                $rootScope._deployment_roles = {}
                data.map(api.addDeploymentRole)
            })
    }

    api.addProvider = function(provider) {
        var id = provider.id
        $rootScope._providers[id] = provider
        $rootScope.$broadcast("provider"+id+"Done")
    }

    // api call for getting all the providers
    api.getProviders = function() {
        return api('/api/v2/providers').
            success(function(data){
                $rootScope._providers = {}
                data.map(api.addProvider)
            })
    }

    api.addNetwork = function(network) {
        var id = network.id
        $rootScope._networks[id] = network
        $rootScope.$broadcast("network"+id+"Done")
    }

    // api call for getting all the providers
    api.getNetworks = function() {
        return api('/api/v2/networks').
            success(function(data){
                $rootScope._networks = {}
                data.map(api.addNetwork)
            })
    }

    api.addNodeRole = function(role) {
        var id = role.id
        role.status = $rootScope.states[role.state]

        $rootScope._node_roles[id] = role
        $rootScope.$broadcast("node_role"+id+"Done")
    }

    // api call for getting all the node roles
    api.getNodeRoles = function() {
        return api('/api/v2/node_roles?runlog').
            success(function(data){
                $rootScope._node_roles = {}
                data.map(api.addNodeRole)
            })
    }

    api.addBarclamp = function(barclamp) {
        var id = barclamp.id
        $rootScope._barclamps[id] = barclamp
        $rootScope.$broadcast("barclamp"+id+"Done")
    }

     // api call for getting all the barclamps
    api.getBarclamps = function() {
        return api('/api/v2/barclamps').
            success(function(data){
                $rootScope._barclamps = {}
                data.map(api.addBarclamp)
            })
    }

    return api;
    
})

})();