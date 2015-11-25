import d3 from 'd3'
import React from 'react'
import ReactDOM from 'react-dom'

var GeoGridD3 = {}
GeoGridD3.enter = (props, selection) => {
  makeGridPlot(props, selection, 2000)
}

GeoGridD3.update = (props, selection) => {
  selection.selectAll('*').remove()
  setTimeout(function() {
    makeGridPlot(props, selection, 0)
  }, 300)
}

var GeoGrid = React.createClass({
  componentDidMount: function() {
    this.d3Node = d3.select(ReactDOM.findDOMNode(this))
    this.d3Node.call(GeoGridD3.enter.bind(this, this.props))
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    if(JSON.stringify(nextProps.grid) !== JSON.stringify(this.props.grid) ||
      JSON.stringify(nextProps.d) !== JSON.stringify(this.props.d) ||
      nextProps.gx !== this.props.gx ||
      nextProps.gy !== this.props.gy) {

      this.d3Node.call(GeoGridD3.update.bind(this, nextProps))
    }
    return false
  },
  render: function() {
    // d3 takes care of plotting the time series
    return(
      <g>
      </g>
    )
  }
})

var makeGridPlot = (props, selection, delay) => {
  var grid = props.grid
  var tx = (props.gx - 1) * grid.binSize + grid.padx
  var ty = (props.gy - 1) * grid.binSize + grid.pady

  var xs = d3.scale.linear().domain([1992, 2017]).range([tx + 12, tx + grid.binSize - 6]),
      ys = d3.scale.linear().domain([0, 80]).range([ty + grid.binSize - 8, ty + 17])

  var yaxis = d3.svg.axis().scale(ys).orient('left')
    .tickValues([0, 20, 40, 60])
    .tickSize(-(grid.binSize - 14), 0, 0)
    .tickPadding(3)

  var line = d3.svg.line()
    .x(function(d) { return xs(d.x) })
    .y(function(d) { return ys(d.y) })

  selection.append('g')
    .attr('transform', 'translate(' + (tx + 12) + ',0)')
    .attr('class', 'y axis')
    .transition()
    .delay(delay)
    .call(yaxis)
    .selectAll('text')
    .attr('transform', 'rotate(-90)translate(0,4)')
    .attr('dy', '-6px')
    .style('text-anchor', 'start')

  var tooltip = d3.select('#tooltip')
    .attr('class', 'tooltip')
    .style('opacity', 0)

  selection.selectAll('.circle')
    .data(props.d)
    .enter().append('circle')
    .attr('cx', function(d) { return xs(d.x) })
    .attr('cy', function(d) { return ys(d.y) })
    .attr('r', 3)
    .style('stroke-width', '5')
    .attr('opacity', 0)
    .transition().delay(delay)
    .attr('opacity', 1)

  var r1 = d3.format(".1f")

  selection.selectAll('.circle2')
  .data(props.d)
  .enter().append('circle')
  .attr('cx', function(d) { return xs(d.x) })
  .attr('cy', function(d) { return ys(d.y) })
  .attr('r', 9)
  .attr('opacity', 0)
  .on('mouseover', function(d) {
    tooltip.transition()
      .duration(100)
      .style('opacity', 0.8)
    tooltip.html(d.x + '<br/>' + r1(d.y, 1) + '%')
      .style('left', (xs(d.x) - 48) + 'px')
      .style('top', (ys(d.y) - 28) + 'px')
  })
  .on('mouseout', function(d) {
      tooltip.transition()
        .duration(100)
        .style("opacity", 0)
  })

  selection.append('path')
    .datum(props.d)
    .attr("d", line)
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .attr('fill', 'none')
    .attr('opacity', 0)
    .transition().delay(delay)
    .attr('opacity', 1)
}

export default GeoGrid
