import d3 from 'd3'
import React from 'react'
import consts from '../constants/constants'

var Legend = React.createClass({
  render: function() {
    var legend = {
      left       : this.props.left,
      top        : this.props.top,
      height     : this.props.height,
      entryWidth : this.props.entryWidth
    }

    return(
      <g>
        <text
          x         = {legend.left}
          y         = {legend.top - 8}
          className = 'legend-text'
        >Average percent stunting - children under 5 (1995 - 2014)</text>
        <rect
          x      = {legend.left}
          y      = {legend.top}
          height = {legend.height}
          width  = {consts.legendColors.length * legend.entryWidth}
          fill   = '#ffffff'
        />
        {consts.legendColors.map((d, i) => {
          return <rect
            key     = {'legend-' + i}
            x       = {legend.left + i * legend.entryWidth}
            y       = {legend.top}
            height  = {legend.height}
            width   = {legend.entryWidth}
            fill    = {d}
            opacity = '0.65'
          />
        })}
        {consts.legendColors.map((d, i) => {
          var label = consts.colors.invertExtent(d).toString().replace(",", " - ")
          return <text
            key       = {'legend-lbl-' + i}
            x         = {legend.left + i * legend.entryWidth}
            y         = {legend.top + legend.height + 12}
            className = 'legend-lbl-text'
          >{label}</text>
        })}
      </g>
    )
  }
})

export default Legend
