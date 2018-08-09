/*D3 Chart Controller - JS*/

odoo.define('stock_d3.index', function (require) {
    "use strict";

    var Model = require('web.DataModel');
    var ajax = require('web.ajax');
    var config = require('web.config');
    var Widget = require('web.Widget');
    var website = require('website.website');
    var treeData = [];
    /*var treeData = [
      {
        "name": "0000000000017",
        "parent": "null",
        "children": [
          {
            "name": "999-777-01",
            "parent": "0000000000017",
            "children": [
              {
                "name": "230000111111",
                "parent": "999-777-01"
              },
              {
                "name": "1234-5555",
                "parent": "999-777-01"
              }
            ]
          },
          {
            "name": "1000222",
            "parent": "0000000000017"
          }
        ]
      }
    ];//Demo Tree Data*/

    var id = getQueryVariable("id");

    var Lots = new Model('stock.production.lot');
    Lots.query(['id','name']).filter([['name', '=', id]]).all().then(function(data) {
      treeData = [
        {
          "name": data[0].name,
          "parent": "null",
          "children": []
        }
      ];

      var MoveLots = new Model('stock.move.lots');
      MoveLots.query(['lot_id']).filter([['destination_lot_id', '=', data[0].name]]).all().then(function(childdata) {
        for (var i = 0; i < childdata.length; i++) {
          treeData[0].children.push({
            "name": childdata[i].lot_id[1],
            "parent": data[0].name
          });
        }
        drawGraph();
      });
    });

    function drawGraph(){
      setTimeout(function(){
        // ************** Generate the tree diagram	 *****************

        var margin = {top: 10, right: 120, bottom: 10, left: 120},
        width = 960 - margin.right - margin.left,
        height = 500 - margin.top - margin.bottom;

        var i = 0,
          duration = 750,
          root;

        var tree = d3.layout.tree()
          .size([height, width]);

        var diagonal = d3.svg.diagonal()
          .projection(function(d) { return [d.y, d.x]; });

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
          nodes.forEach(function(d) { d.y = d.depth * 180; });

          // Update the nodes…
          var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

          // Enter any new nodes at the parent's previous position.
          var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("click", click);

          nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

          nodeEnter.append("text")
            .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            .text(function(d) { return d.name; })
            .style("fill-opacity", 1e-6);

          // Transition nodes to their new position.
          var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

          nodeUpdate.select("circle")
            .attr("r", 10)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

          nodeUpdate.select("text")
            .style("fill-opacity", 1);

          // Transition exiting nodes to the parent's new position.
          var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
            .remove();

          nodeExit.select("circle")
            .attr("r", 1e-6);

          nodeExit.select("text")
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
            })
            .remove();

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
