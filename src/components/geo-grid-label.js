import d3 from 'd3'
import React from 'react'
import ReactDOM from 'react-dom'

var GeoGridLabelD3 = {}

GeoGridLabelD3.enter = (props, selection) => {
  var grid = props.grid
  var tx = (props.gx - 1) * grid.binSize + grid.padx + 4
  var ty = (props.gy - 1) * grid.binSize + grid.pady + 12 + 3

  selection.select('text')
    .attr('opacity', '0')
    .text(props.name)
    .transition(500)
    .delay(1500)
    .attr('opacity', '1')
    .attr('x', tx)
    .attr('y', ty)
}

GeoGridLabelD3.update = (props, selection) => {
  var grid = props.grid
  var tx = (props.gx - 1) * grid.binSize + grid.padx + 4
  var ty = (props.gy - 1) * grid.binSize + grid.pady + 12 + 3

  selection.select('text')
    .transition().duration(200)
    .attr('x', tx)
    .attr('y', ty)
}

var GeoGridLabel = React.createClass({
  componentDidMount: function() {
    this.d3Node = d3.select(ReactDOM.findDOMNode(this))
    this.d3Node.call(GeoGridLabelD3.enter.bind(this, this.props))
  },
  componentDidUpdate() {
    this.d3Node.call(GeoGridLabelD3.update.bind(this, this.props))
  },
  render: function() {
    var gridFontSize = 12
    var textStyle = {
      pointerEvents: 'none',
      fontSize: gridFontSize
      // textAnchor: 'end'
    }

    return(
      <g>
        <text style={textStyle}>
        </text>
      </g>
    )
  }
})

export default GeoGridLabel
