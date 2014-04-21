function vector(x, y){
    if (typeof x == "undefined") x =0;
    if (typeof y == "undefined") y =0;
    return {
        distance: function(to){
            return Math.sqrt( (x-to.x)*(x-to.x)+(y-to.y)*(y-to.y));
        },
        add: function(to){
            return vector(x+to.x, y+to.y);
        },
        sub: function(wit){
            return vector(x-wit.x, y-wit.y);
        },
        mul: function(wit){
            return vector(x*wit.x, y*wit.y);
        },
        div: function(wit){
            return vector(x/wit.x, y/wit.y);
        },
        clone:function(){
            return vector(x, y);
        },
        normalize:function(){
            var l = this.distance;
            return vector(x/l,y/l);
        },
        divScalar:function(scalar){
            return vector(x/scalar, y/scalar);
        },
        scalarDiv:function(scalar){
            return vector(scalar/x, scalar/y);
        },
        multiplyScalar:function(scalar){
            return vector(scalar*x, scalar*y);
        },
        x: x,
        y: y
    };
}

function Graph(){
    var uids = 0;
    var edges = [];
    var nodes = [];

    var iexts = {};

    function _addNodeToGraph(node){
        nodes.push(node);
        iexts[node.externalInterface.getId()] = node;
        return node.externalInterface;
        }
    function _newEdge(edge, fromNodeEdges, toNodeEdges){
        fromNodeEdges.push(edge);
        toNodeEdges.push(edge);
        edges.push(edge);
        return edge;
        }
    function _removeEdge(edge){
        var iof = edges.indexOf(edge);
        if (iof>=0){
                _findNodeByExternalInterface(edge.from)._removeEdge(edge);
                _findNodeByExternalInterface(edge.to)._removeEdge(edge);
                return edges.splice(iof, 1);
            }
        return null;
        }
    function _findNodeByExternalInterface(iext){
        return iexts[iext.getId()];

        }
    function _removeNode(node){
        var iof = nodes.indexOf(node);
        if (iof>=0){
                node.externalInterface.linksIterator().iterate(function(node,i,iterator){
                    iterator.remove();
                });
                delete iexts[node.externalInterface.getId()];
                return nodes.splice(iof, 1);
            }

        }
    function _setComponent(ccmap, node, curId){

    }
    function setClassId(node, ccmap, clsId){
        if (ccmap[node.getId()]!=-1) return;
        ccmap[node.getId()]=clsId;
        node.adjacentNodesIterator().iterate(function(nde){
            setClassId(nde, ccmap, clsId);
        });
    }

    var graph = {
        addNode: function(data){
            return _addNodeToGraph( node(data) );
        },
        length: function(){
            return nodes.length;
        },
        nodesIterator: function(){
            return iterator(nodes, function(nodeInternal){ return nodeInternal.externalInterface;});
        },
        edgesIterator: function(){
            return iterator(edges);
        },
        addEdge: function(fromNode, toNode, data){
            var finded = null;
            fromNode.linksIterator().iterate(function(link){
                if ( (link.from.getId()==fromNode.getId() && link.to.getId()==toNode.getId()) ||
                     (link.from.getId()==toNode.getId() && link.to.getId()==fromNode.getId()) ){
                    finded = link;
                    return false;
                }
                return true;
            });
            if (finded) return finded;

            return fromNode.link(toNode,data);
        },
        removeEdgesBetween: function(from, to){
            //console.log("remove edge");
            var toId = to.getId();
            from.linksIterator().iterate(function(node,i, it){
                //console.log(node.getTo(from).getId(),toId);
                if (node.getTo(from).getId()==toId){
                    it.remove();
                    return false;
                }
                return true;
            });
        },
        outGraph: function(){
            return {nodes: nodes, edges: edges, iexts: iexts};
        },
        buildConnectedComponents: function(){
            var ccmap = {};
            this.nodesIterator().iterate(function(node){
                ccmap[node.getId()] = -1;
            });

            var curId =0;
            this.nodesIterator().iterate(function(node){

                if ( ccmap[node.getId()] ==-1){
                    setClassId(node, ccmap, curId);
                    curId++;
                }

            });
            return {
                classesCount: curId,
                getFor:function(id){return ccmap[id];}
            }
        }
    };


    function node(data){
        var id = ++uids;
        var edges = [];
        return {
            nodeEdges: edges,
            _removeEdge: function(edge){
                var iof = edges.indexOf(edge);
                if (iof>=0)
                    return edges.splice(iof,1);
                return null;
            },
            externalInterface:{
                graph: graph,
                data: data,
                getId: function(){ return id;},
                isConnectedWith: function(node){
                    var self = this;
                    finded = false;
                    linksIterator().iterate(function(link){
                        if (link.getTo(self).getId() == toId) finded=true;
                    });
                    return finded;
                },
                link:function(toNode, data){
                    return _newEdge(edge(this, toNode, data), edges, _findNodeByExternalInterface(toNode).nodeEdges);
                },
                linksIterator: function(){
                    return iterator(edges);
                },
                adjacentNodesIterator: function(){
                    var curnode = this;
                    return iterator(edges, function(edge){return edge.getTo(curnode);});
                },
                remove: function(){
                    _removeNode(_findNodeByExternalInterface(this));
                }
            }
        };
    }

    function edge(from, to, data){
        return {
                graph: graph,
                from: from,
                to: to,
                data: data,
                getTo: function(node){
                    return node?((node==to)?from:to):to;
                },
                getFrom: function(node){
                    return node?((node==from)?to:from):from;
                },
                remove: function(){
                    _removeEdge(this);
                }
        };
    }

    function iterator(arr, filterFunc){
        function getVal(jj){
            if (filterFunc) return filterFunc(jj);
            else return jj;
        }
        var i = 0;
        return {
            length: function(){ return arr.length;},
            next: function(){
                if (this.hasMore()){
                    return getVal(arr[i++]);
                } else return false;
            },
            hasMore: function(){ return (arr.length-1)>=i;},
            remove: function(){  i--; getVal(arr[i]).remove(); },
            iterate: function(callback){
                var nextEdge;
                while( (nextEdge = this.next())){
                    callback(nextEdge, i, this);
                }
            }
        };
    }

    return graph;
}

function Esoinn(configs){
    if (typeof configs == "undefined") configs = {ageMax: 30, iterationThreshold: 50, c1: 0.0001, c2: 1};
    var ageMax=configs.ageMax;
    var iterationCount=0;
    var iterationThreshold = configs.iterationThreshold;
    var graph = Graph();
    var c1=configs.c1;
    var c2=configs.c2;
    var numberOfClasses = 0;

    function distance(from, to){

        return from.distance(to);
    }

    function findWinners(input){
        var firstWinner, secondWinner;
        firstWinnerDistance = Number.MAX_VALUE;
        secondWinnerDistance = Number.MAX_VALUE;
        graph.nodesIterator().iterate(function(node){

            var dist = distance(input, node.data.weight);
            if(dist < firstWinnerDistance) {
                secondWinner = firstWinner;
                secondWinnerDistance = firstWinnerDistance;
                firstWinner = node;
                firstWinnerDistance = dist;
            } else if(dist < secondWinnerDistance) {
                secondWinner = node;
                secondWinnerDistance = dist;
            }
        });
        return [firstWinner, secondWinner];
    }
    function getSimilarityThreshold(node){
        var dist = 0;
        if (node.linksIterator().length() === 0){
            dist = Number.MAX_VALUE;
            node.graph.nodesIterator().iterate(function(nde){
                if (nde.getId()!=node.getId()){
                    var distCurrent = distance(node.data.weight, nde.data.weight);
                    if (distCurrent<dist)
                        dist = distCurrent;
                }
            });
        }else{
            dist = Number.MIN_VALUE;
            node.adjacentNodesIterator().iterate(function(nde){
                var distCurrent = distance(nde.data.weight, node.data.weight);
                if (distCurrent>dist)
                    dist = distCurrent;
            });
        }
        return dist;
    }
    function isWithinThreshold(inputSignal, first, second){
        if(distance(inputSignal, first.data.weight) > getSimilarityThreshold(first)) {
            return false;
        }
        if(distance(inputSignal, second.data.weight) > getSimilarityThreshold(second)) {
            return false;
        }
        return true;
    }
    function incrementEdgesAge(node){
        node.linksIterator().iterate(function(edge){
            edge.data.age++;
        });
    }
    function needAddEdge(first, second){
        if ( first.data.classId == -1 || second.data.classId == -1 ) {
            return true;
        } else if(first.data.classId == second.data.classId) {
            return true;
        } else if(first.data.classId != second.data.classId && needMergeClasses(first, second)) {
            return true;
        }
        return false;
    }
    function needMergeClasses(a, b){
        var A = a.data.classId;
        var meanA = meanDensity(A);
        var maxA = maxDensity(A);
        var thresholdA = densityThershold(meanA, maxA);

        var B = b.data.classId;
        var meanB = meanDensity(B);
        var maxB = maxDensity(B);
        var thresholdB = densityThershold(meanB, maxB);

        var minAB = Math.min(a.data.density, b.data.density);
        if(minAB > thresholdA * maxA || minAB > thresholdB * maxB) {
            return true;
        }
        return false;
    }
    function meanDensity(classId) {
        if(classId == -1) return 0.0;
        var n = 0;
        var density = 0.0;

        graph.nodesIterator().iterate(function(node){
            if (node.data.classId == classId) {
                n++;
                density += node.data.density;
            }
        });

        return density/n;
    }
    function maxDensity(classId) {
        var density = Number.MIN_VALUE;

        graph.nodesIterator().iterate(function(node){
            if(node.data.density > density && node.data.classId == classId) {
                density = node.data.density;
            }
        });

        return density;
    }
    function densityThershold(mean, max) {
        var threshold=0;
        if(2.0 * mean >= max) {
            threshold = 0.0;
        } else if(3.0 * mean >= max && max > 2.0 * mean) {
            threshold = 0.5;
        } else if (max > 3*mean) {
            threshold = 1.0;
        }
        return threshold;
    }
    function updateDensity(node) {
        var mDistance = meanDistance(node);
        node.data.numberOfSignals++;
        node.data.S += 1/((1 + mDistance)*(1 + mDistance));
        node.data.density = node.data.S/node.data.numberOfSignals;
    }
    function meanDistance(node) {
        var mDistance = 0.0;
        var m = 0;

        node.adjacentNodesIterator().iterate(function(nde){
            mDistance += distance(node.data.weight, nde.data.weight);
            m++;
        });

        return mDistance/m;
        }
    function updateWeights(first, inputSignal) {
        first.data.weight = inputSignal.sub(first.data.weight).multiplyScalar(1/first.data.numberOfSignals).add(first.data.weight);
        first.adjacentNodesIterator().iterate(function(node){
            node.data.weight = inputSignal.sub(node.data.weight).multiplyScalar(1/(first.data.numberOfSignals*100)).add(node.data.weight);
        });
    }
    function deleteOldEdges() {
        graph.edgesIterator().iterate(function(edge,i,iterator){
            if (edge.data.age>ageMax){
                iterator.remove(edge);
            }
        });
    }
    function updateClassLabels() {
        markClasses();
        partitionClasses();
        deleteNoiseVertex();
    }
    function markClasses() {
        var vertexList=[];
        graph.nodesIterator().iterate(function(node){
            node.data.classId = -1;
            vertexList.push(node);
        });

        vertexList = vertexList.sort(function(a,b){
            if(a.data.density<b.data.density)
                return -1; // Или любое число, меньшее нуля
            if(a.data.density>b.data.density)
                return 1;  // Или любое число, большее нуля
            // в случае а = b вернуть 0
            return 0;
        });

        var classCount = 0;
        for(var i=0;i<vertexList.length;i++) {
            if(vertexList[i].data.classId == -1) {
                vertexList[i].data.classId = classCount;
                markAdjacentVertices(vertexList[i], classCount++);
            }
        }
    }
    function markAdjacentVertices(node, cID) {
        node.adjacentNodesIterator().iterate(function(nde){
            if(nde.data.classId == -1 && nde.data.density < node.data.density) {
                nde.data.classId = cID;
                markAdjacentVertices(nde, cID);
            }
        });
    }
    function deleteNoiseVertex() {
        graph.nodesIterator().iterate(function(node, i, iterator){
            var mean = meanDensity(node.data.classId);
            if(     (node.linksIterator().length() == 2 && node.data.density < c1* mean) ||
                    (node.linksIterator().length() == 1 && node.data.density < c2* mean) ||
                    (node.linksIterator().length() === 0)
                ){
                iterator.remove();
            }
        });
    }

    function partitionClasses() {
        graph.edgesIterator().iterate(function(edge,i, it){
            if (edge.from.data.classId != edge.to.data.classId){
                if (needMergeClasses(edge.from, edge.to)){
                    mergeClasses(edge.from.classId, edge.to.classId);
                }
                else{
                    it.remove();
                }
            }
        });
    }
    function mergeClasses( A,  B) {
        var classId = Math.min(A, B);

        graph.nodesIterator().iterate(function(node){
            if (node.data.classId==A || node.data.classId==B)
                node.data.classId = classId;
        });

    }
    function classify() {
        deleteNoiseVertex();
        var ccmap = graph.buildConnectedComponents();
        numberOfClasses = ccmap.classesCount;
        graph.nodesIterator().iterate(function(node){
            node.data.classId = ccmap.getFor(node.getId());
        });
    }

    return {
        addSignal: function(vec){
            if (graph.length()<2){
                graph.addNode({weight: vec, classId:-1, density: 0, numberOfSignals: 0, S:0});
                return;
            }
            var winners = findWinners(vec);
            //console.log(winners[0].getId(), winners[1].getId());
            if (winners.length<2 || typeof winners[0] == "undefined" || typeof winners[1]=="undefined"){
                console.log("ERROR");
                return;
            }
            var firstWinner = winners[0] ,secondWinner = winners[1];

            if (!isWithinThreshold(vec, firstWinner, secondWinner)){
                graph.addNode({weight: vec, classId:-1, density: 0, numberOfSignals: 0, S:0});
                return;
            }
            incrementEdgesAge(firstWinner);
            if(needAddEdge(firstWinner, secondWinner)) {
                var edge = graph.addEdge(firstWinner, secondWinner, {age:0});
                edge.data.age=0;
            } else {
                graph.removeEdgesBetween(firstWinner, secondWinner);
            }
            updateDensity(firstWinner);
            updateWeights(firstWinner, vec);
            deleteOldEdges();
            if(iterationCount % iterationThreshold === 0) {
                updateClassLabels();
            }
            iterationCount++;
        },
        end:function(){
            updateClassLabels();
        },
        getCenterOfCluster:function(classId) {
            var density = -1;
            var center = null;
            graph.nodesIterator().iterate(function(node){
                if (node.data.classId == classId && node.data.density > density){
                    center = node;
                    density = node.data.density;
                }
            });

            return center.data.weight;
        },
        getBestMatch:function(signal) {
            var firstWinner = null;
            var firstWinnerDistance = Number.MAX_VALUE;

            graph.nodesIterator().iterate(function(node){
                var dist = distance(signal, node.data.weight);
                if (dist<firstWinnerDistance){
                    firstWinner = node;
                    firstWinnerDistance = dist;
                }
            });

            return firstWinner;
        },
        classify: classify,
        numberOfClasses: numberOfClasses,
        graph: graph
    };
}

// var g = Graph();
// var n1 = g.addNode({a:1});
// var n2 = g.addNode({a:2});
// g.addNode({a:3}).link(n1);
// var l = n1.link(n2);

// g.nodesIterator().iterate(function(n, i, iter){
//     if (n.data.a==3) iter.remove();
// });
// var n4 = g.addNode({a:4}).link(n2).from;
// g.removeEdgesBetween(n2,n4);
// g.addEdge(n4,n1);
// g.nodesIterator().iterate(function(n){
//     console.log(n.data);
//     n.linksIterator().iterate(function(t){
//         console.log("   "+n.getId()+"->"+t.getTo(n).getId());
//     });
// });

// //console.log(g.outGraph());

// //process.exit(1);

// var esoinn = Esoinn();
// esoinn.addSignal(vector(2,2));
// esoinn.addSignal(vector(2,3));
// esoinn.addSignal(vector(5,5));
// esoinn.addSignal(vector(6,5));
// esoinn.addSignal(vector(7,5));

// console.log(esoinn.getBestMatch(vector(6,6)));