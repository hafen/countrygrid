import d3 from 'd3'
import React from 'react'
import ReactDOM from 'react-dom'
import consts from '../constants/constants'

var CountryLabelD3 = {}

var labelFontSize = (scale, zoomed) => {
  var size = zoomed ? 40 : 15
  return size / scale + 'px'
}

CountryLabelD3.enter = (props, selection) => {
  selection.selectAll('text')
    .attr('transform', props.transform)
    .style('font-size', labelFontSize(props.scale, props.zoomed))
    .attr('x', props.centroid[0])
    .attr('y', props.centroid[1])

  // selection.selectAll('.avg-label-text')
  //   .attr('transform', props.transform)
  //   .attr('y', props.centroid[1] + 15 / Math.sqrt(props.scale))
}

CountryLabelD3.update = (props, selection) => {
  selection.selectAll('text')
    .transition().duration(consts.transformDuration)
    .attr('transform', props.transform)
    .style('font-size', labelFontSize(props.scale, props.zoomed))
}

var CountryLabel = React.createClass({
  componentDidMount: function() {
    this.d3Node = d3.select(ReactDOM.findDOMNode(this))
    this.d3Node.call(CountryLabelD3.enter.bind(this, this.props))
  },
  componentDidUpdate() {
    this.d3Node.call(CountryLabelD3.update.bind(this, this.props))
  },
  render: function() {
    var textStyle = {
      fill          : this.props.active ? "black" : "#777",
      pointerEvents : 'none'
    }

    var avgTextStyle = {
      fontSize      : '6px',
      pointerEvents : 'none'
    }

    var name = this.props.stuntAvg ? this.props.name + ' - ' + Math.round(this.props.stuntAvg) + '%' : this.props.name
    return(
      <g>
        <text style={textStyle} textAnchor='middle'>{name}</text>
      </g>
    )
  }
})

export default CountryLabel
