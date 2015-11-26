import d3 from 'd3'
import React from 'react'
import ReactDOM from 'react-dom'

var ClusterGridPlotD3 = {}
ClusterGridPlotD3.enter = (props, selection) => {
  makeGridPlot(props, selection, 2000)
}

ClusterGridPlotD3.update = (props, selection) => {
  selection.selectAll('*').remove()
  setTimeout(function() {
    makeGridPlot(props, selection, 0)
  }, 300)
}

var ClusterGridPlot = React.createClass({
  componentDidMount: function() {
    this.d3Node = d3.select(ReactDOM.findDOMNode(this))
    this.d3Node.call(ClusterGridPlotD3.enter.bind(this, this.props))
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    if(JSON.stringify(nextProps.grid) !== JSON.stringify(this.props.grid) ||
      JSON.stringify(nextProps.d) !== JSON.stringify(this.props.d) ||
      nextProps.gx !== this.props.gx ||
      nextProps.gy !== this.props.gy) {

      this.d3Node.call(ClusterGridPlotD3.update.bind(this, nextProps))
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

  var xs = d3.scale.linear().domain([1991, 2017]).range([tx, tx + grid.binSize]),
      ys = d3.scale.linear().domain([0, 80]).range([ty + grid.binSize, ty])

  var yaxis = d3.svg.axis().scale(ys).orient('left')
    .tickValues([10, 30, 50, 70])
    .tickSize(-(grid.binSize), 0, 0)
    .tickPadding(3)

  var xaxis = d3.svg.axis().scale(xs).orient('bottom')
    .tickValues([1994, 1999, 2004, 2009, 2014])
    .tickSize((grid.binSize), 0, 0)
    .tickPadding(3)
    .tickFormat(function(d) {
      var res = '\'' + (d + '').substr(2, 2)
      return res
    })

  var line = d3.svg.line()
    .x(function(d) { return xs(d.x) })
    .y(function(d) { return ys(d.y) })

  selection.append('g')
    .attr('transform', 'translate(' + tx + ',0)')
    .attr('class', 'y axis cluster')
    .transition()
    .delay(delay)
    .call(yaxis)
    .selectAll('text')
    // .attr('transform', 'rotate(-90)translate(0,4)')
    // .attr('dy', '-6px')
    // .style('text-anchor', 'start')

  if(props.gx !== 1) {
    selection.select('.y.axis.cluster').selectAll('text')
      .attr('fill-opacity', '0')
  }

  selection.append('g')
    .attr('transform', 'translate(0,' + ty + ')')
    .attr('class', 'x axis cluster')
    .transition()
    .delay(delay)
    .call(xaxis)

  if(props.gy !== grid.nrow && !(props.gx === grid.ncol && props.gy === grid.lastnrow)) {
    selection.select('.x.axis.cluster').selectAll('text')
      .attr('fill-opacity', '0')
  }

  var tooltip = d3.select('#tooltip')
    .attr('class', 'tooltip')
    .style('opacity', 0)

  selection.selectAll('.circle')
    .data(props.d)
    .enter().append('circle')
    .attr('cx', function(d) { return xs(d.x) })
    .attr('cy', function(d) { return ys(d.y) })
    .attr('r', 3.5)
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
  .attr('r', 13)
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
    .attr('stroke-width', 2.5)
    .attr('fill', 'none')
    .attr('opacity', 0)
    .transition().delay(delay)
    .attr('opacity', 1)
}

export default ClusterGridPlot
