/*D3 Chart Controller - JS*/

odoo.define('stock_d3.index', function (require) {
    "use strict";

    var Model = require('web.DataModel');
    var ajax = require('web.ajax');
    var config = require('web.config');
    var Widget = require('web.Widget');
    var website = require('website.website');
    var treeData = [];

    var id = getQueryVariable("id");
    var children = [];

    var Lots = new Model('stock.production.lot');
    Lots.query(['id','name', 'product_id']).filter([['id', '=', id]]).all().then(function(data) {
      var product = limitChars(data[0].product_id[1]);
      treeData = [
        {
          "name": data[0].name,
          "product": product,
          "parent": "null",
          "children": []
        }
      ];

      var MoveLots = new Model('stock.move.lots');
      MoveLots.query(['lot_id', 'product_id']).filter([['destination_lot_id', '=', data[0].name]]).all().then(function(childdata) {
        for (var i = 0; i < childdata.length; i++) {
          var product = limitChars(childdata[i].product_id[1]);
          children.push({
            "name": childdata[i].lot_id[1],
            "product": product,
            "parent": data[0].name,
            "children": []
          });
          recurChild(childdata[i].lot_id[1], children[i]);
        }

        setTimeout(function(){
          children.length = childdata.length;
          treeData[0].children = children;
          drawGraph();
        }, 1000);
      });
    });

    function recurChild(parent, c){
      var ChildLots = new Model('stock.move.lots');
      ChildLots.query(['lot_id', 'product_id']).filter([['destination_lot_id', '=', parent]]).all().then(function(indata) {
        for (var i = 0; i < indata.length; i++) {
          var product = limitChars(indata[i].product_id[1]);
          c.children.push({
            "name": indata[i].lot_id[1],
            "product": product,
            "parent": parent,
            "children": []
          });
          children.push(c);
          recurChild(indata[i].lot_id[1], c.children[i]);
        }
      });
    }

    function limitChars(str){
      if(str){
        if(str.length > 17){
          return "("+str.replace(/\[(.+?)\] /g, "").substring(0, 12) + "...)";
        }else{
          return "("+str.replace(/\[(.+?)\] /g, "")+")";
        }
      }else{
        return "()";
      }
    }

    function drawGraph(){
      setTimeout(function(){
        // ************** Generate the tree diagram	 *****************
        var margin = {top: 50, right: 120, bottom: 10, left: (window.innerWidth-250) / 2},
        width = (window.innerWidth-250) - margin.right - margin.left,
        height = 600 - margin.top - margin.bottom;

        var i = 0,
          duration = 750,
          root;

        var nodeWidth = 110;
        var nodeHeight = 75;
        var horizontalSeparationBetweenNodes = 16;
        var verticalSeparationBetweenNodes = 128;

        var tree = d3.layout.tree()
            .nodeSize([nodeWidth + horizontalSeparationBetweenNodes, nodeHeight + verticalSeparationBetweenNodes])
            .separation(function(a, b) {
                return a.parent == b.parent ? 1 : 1.25;
        });

        var diagonal = d3.svg.diagonal()
          .projection(function(d) { return [d.x, d.y]; });

        var svg = d3.select("#stock_d3").append("svg")
          .attr("width", width + margin.right + margin.left)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        root = treeData[0];
        root.x0 = height / 2;
        root.y0 = 0;

        update(root);

        d3.select(self.frameElement).style("height", "500px");

        function update(source) {

          // Compute the new tree layout.
          var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

          // Normalize for fixed-depth.
          nodes.forEach(function(d) {
            d.y = d.depth * 90;
          });

          // Update the nodes…
          var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

          // Enter any new nodes at the parent's previous position.
          var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
            .on("click", click);

          nodeEnter.append("rect")
            .attr("width", 5)
            .attr("height", 5)
            .attr("y", 0)
            .attr("x", 0)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

          nodeEnter.append("text")
            .append("tspan")
        	  .attr("x", function(d) { return d.children || d._children ? 0 : 0; })
        	  .attr("dy", "-0.2em")
        	  .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        	  .text(function(d) { return d.name; })
            .append("tspan")
        	  .attr("x", function(d) { return d.children || d._children ? 0 : 0; })
        	  .attr("dy", "1.1em")
        	  .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        	  .text(function(d) { return d.product; });

          // Transition nodes to their new position.
          var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

          nodeUpdate.select("rect")
            .attr("width", 120)
            .attr("height", 50)
            .attr("y", -25)
            .attr("x", -60)
            //.attr("x", function(d) { return d.children || d._children ? -80 : 0; })
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

          nodeUpdate.selectAll("tspan")
            .attr("x", function(d) { return d.children || d._children ? 0 : 0; })
            .style("text-anchor", "middle")
            .style("fill-opacity", 1);

          // Transition exiting nodes to the parent's new position.
          var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
            .remove();

          nodeExit.select("rect")
            .attr("y", 0)
            .attr("x", 0)
            .attr("width", 5)
            .attr("height", 5);

          nodeExit.selectAll("tspan")
            .style("fill-opacity", 1e-6);

          // Update the links…
          var link = svg.selectAll("path.link")
            .data(links, function(d) { return d.target.id; });

          // Enter any new links at the parent's previous position.
          link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
            });

          // Transition links to their new position.
          link.transition()
            .duration(duration)
            .attr("d", diagonal);

          // Transition exiting nodes to the parent's new position.
          link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
            }).remove();

          // Stash the old positions for transition.
          nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
          });
        }

        // Toggle children on click.
        function click(d) {
          if (d.children) {
          d._children = d.children;
          d.children = null;
          } else {
          d.children = d._children;
          d._children = null;
          }
          update(d);
        }
      }, 1);
    }

    function getQueryVariable(variable){
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
    }
}); //END stock_d3.index
