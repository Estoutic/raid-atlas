(function(root){
 // Evaluate the exact required-stop tour for every permitted end, using shared legs.
 function choose(matrix,n,candidates,requires=[]){const results=[];for(const candidate of candidates){const indices=[0,...Array.from({length:n},(_,i)=>i+1),candidate.node],sub=indices.map(i=>indices.map(j=>matrix[i][j]));const tour=root.RA.optimize(sub,n,requires);if(tour)results.push({...candidate,...tour,cost:tour.cost+(candidate.extraCost||0)});}results.sort((a,b)=>a.cost-b.cost||a.index-b.index);return {best:results[0]||null,results};}
 root.RouteChoice={choose};if(typeof module!=='undefined')module.exports=root.RouteChoice;
})(typeof window!=='undefined'?window:globalThis);
