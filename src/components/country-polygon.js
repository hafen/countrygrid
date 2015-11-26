import d3 from 'd3'
import React from 'react'
import ReactDOM from 'react-dom'
import consts from '../constants/constants'

var CountryPolygon = React.createClass({
  getInitialState: function () {
    return {hover: false}
  },
  componentDidMount: function() {
    this.d3Node = d3.select(ReactDOM.findDOMNode(this))
    this.d3Node
      // .datum(this.props.d)
      .call(CountryPolyD3.enter.bind(this, this.props))
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    // console.log(nextProps.transform)
    // console.log(nextProps.transform !== this.props.transform)
    return nextProps.transform !== this.props.transform || nextProps.viewMode !== this.props.viewMode
  },
  componentDidUpdate() {
    this.d3Node
      // .datum(this.props.d)
      .call(CountryPolyD3.update.bind(this, this.props))
  },
  _mouseOver: function (name) {
    this.setState({hover: true})
    this.props.hover(name)
  },
  _mouseOut: function (name) {
    this.setState({hover: false})
    this.props.hover(name)
  },
  _mouseClick: function(d) {
    if(this.props.viewMode === 'map') {
      this.props.clickZoom(d)
    }
  },
  render: function() {
    var className = this.props.d.active ? 'active-country' : 'country'

    return(
      <g>
        <path
          className   = {className}
          onMouseOver = {this._mouseOver.bind(this, this.props.d.name)}
          onMouseOut  = {this._mouseOut.bind(this, null)}
          onClick     = {this._mouseClick.bind(this, this.props.d)}
        />
      </g>
    )
  }
})

var polyStrokeWidth = (scale, zoomed) => {
  return 1 / scale * (zoomed ? 2 : 0.5)
}

var CountryPolyD3 = {}

CountryPolyD3.enter = (props, selection) => {
  var color = props.d.stuntAvg ? consts.colors(props.d.stuntAvg) : '#ddd'
  // var hcolor = d3.hsl(color).darker(0.4).toString()
  // console.log(color)

  selection.select('path')
    .property({prevViewMode: 'map'})
    .attr('d', consts.path(props.d))
    .attr('transform', props.transform)
    .style('fill', color)
    .style('fill-opacity', 0.65)
    .style('stroke-width', polyStrokeWidth(props.scale, props.zoomed))
    .on('mouseover', function() {
      d3.select(this).style('fill-opacity', 0.75)
    })
    .on('mouseout', function() {
      d3.select(this).style('fill-opacity', 0.65)
    })
}

CountryPolyD3.update = (props, selection) => {
  // determine which view we are in so we know how to morph the polygons
  var prevViewMode = selection.select('path').property('prevViewMode')

  if(props.viewMode === 'map') {
    if(prevViewMode === 'map') {
      // zooming in map mode
      selection.select('path')
        .transition().duration(consts.transformDuration)
        .attr('transform', props.transform)
        .style('stroke-width', polyStrokeWidth(props.scale, props.zoomed))
    } else if(prevViewMode === 'geoGrid' || prevViewMode === 'clusterGrid') {
      // handle going from geoGrid back to map
      selection.select('path')
        .property({prevViewMode: 'map'})

      selection.select('path.country')
        .transition().duration(1000)
        .delay(1500)
        .attr('transform', props.transform)
        .style('opacity', '1')
        .style('stroke-width', polyStrokeWidth(props.scale, props.zoomed))

      selection.select('path.active-country')
        .transition().duration(2000)
        .attr('transform', props.transform)
        .style('fill', consts.colors(props.d.stuntAvg))
        .attr('d', consts.path(props.d))
        .style('stroke-width', polyStrokeWidth(props.scale, props.zoomed))
    }
  } else if(props.viewMode === 'geoGrid') {
    selection.select('path')
      .property({prevViewMode: 'geoGrid'})

    if(prevViewMode === 'geoGrid') {
      // must be a resize
      var gridPath = getSquarePath(props.d, props.grid, consts.projection,
        props.d.gridx, props.d.gridy)
      selection.select('path.active-country')
        .transition().duration(200)
        .attr('d', gridPath)
    } else if(prevViewMode === 'map') {
      // handle going from map to geoGrid

      var gridPath = getSquarePath(props.d, props.grid, consts.projection,
        props.d.gridx, props.d.gridy)

      selection.select('path.country')
        .transition().duration(1000)
        .style('opacity', '0')

      selection.select('path.active-country')
        .transition().duration(2000)
        .attr('transform', 'translate(0)scale(1)')
        .style('fill', consts.colors(props.d.stuntAvg))
        .attr('d', gridPath)
        .style('stroke-width', 2)
    } else if(prevViewMode === 'clusterGrid') {
      // handle going from clusterGrid to geoGrid
      var gridPath = getSquarePath(props.d, props.grid, consts.projection,
        props.d.gridx, props.d.gridy)

      selection.select('path.active-country')
        .transition().duration(2000)
        .attr('transform', 'translate(0)scale(1)')
        .style('fill', consts.colors(props.d.stuntAvg))
        .attr('d', gridPath)
        .style('stroke-width', 2)
    }
  } else if(props.viewMode === 'clusterGrid') {
    if(prevViewMode === 'clusterGrid') {
      // must be resize
      if(props.d.active) {
        var gridPath = getSquarePath(props.d, props.clgrid, consts.projection,
          props.clgridcrd.gridx, props.clgridcrd.gridy)

        selection.select('path.active-country')
          .transition().duration(400)
          .attr('d', gridPath)
      }
    } else {
    // if(prevViewMode === 'map') {
      // handle going from map to clusterGrid
      selection.select('path')
        .property({prevViewMode: 'clusterGrid'})

      selection.select('path.country')
        .transition().duration(1000)
        .style('opacity', '0')

      if(props.d.active) {
        var gridPath = getSquarePath(props.d, props.clgrid, consts.projection,
          props.clgridcrd.gridx, props.clgridcrd.gridy)

        selection.select('path.active-country')
          .transition().duration(2000)
          .style('fill', consts.clusterColors[props.clgridcrd.cl - 1])
          .attr('transform', 'translate(0)scale(1)')
          .attr('d', gridPath)
          .style('stroke-width', 4)
      }
    }
  }
}

var getSquarePath = (d, grid, projection, gridx, gridy) => {

  if(!gridx)
    return ''

  var getAngle = (e, c) => {
    return Math.atan2(e[1] - c[1], e[0] - c[0])
  }

  var getLengthForAngle = (phi) => {
    phi = ((phi * 180 / Math.PI + 45) % 90 - 45) / 180 * Math.PI
    return 1 / Math.cos(phi)
  }

  var convertCoords = (coords, centx, centy, centroid, placeInCentroid) => {
    var gridPoly = []
    var curAngle, curRadius, curCoords, coords, nn
    var corners = [45, 135, 225, 315, 405]
    for (var i = 0; i < corners.length; i++) {
      corners[i] = corners[i] / 180 * Math.PI
    }
    nn = coords.length

    var startCoords = consts.projection(coords[0])
    var startAngle = (getAngle(startCoords, centroid) + 2 * Math.PI) % (2 * Math.PI)
    var angleDelta = 2 * Math.PI / nn
    for (var i = 0; i < nn; i++) {
      // curCoords = consts.projection(coords[i])
      // curAngle = getAngle(curCoords, d.centroid) + 2 * Math.PI
      if(placeInCentroid) {
        gridPoly.push([centx, centy])
      } else {
        curAngle = (startAngle + i * angleDelta) % (2 * Math.PI)
        for (var k = 0; k < corners.length; k++) {
          if(Math.abs(curAngle - corners[k]) < angleDelta) {
            curAngle = corners[k]
          }
        }
        curRadius = getLengthForAngle(curAngle) * grid.binSize / 2
        gridPoly.push([
          centx + curRadius * Math.cos(curAngle),
          centy + curRadius * Math.sin(curAngle)
        ])
      }
    }
    return gridPoly
  }

  var centx = (gridx - 1) * grid.binSize + grid.padx + grid.binSize / 2
  var centy = (gridy - 1) * grid.binSize + grid.pady + grid.binSize / 2

  var res = []
  if(d.geometry.type === 'Polygon') {
    for (var i = 0; i < d.geometry.coordinates.length; i++) {
      res.push(convertCoords(d.geometry.coordinates[i], centx, centy, d.centroid, i > 0))
    }
  } else if(d.geometry.type === "MultiPolygon") {
    for (var i = 0; i < d.geometry.coordinates.length; i++) {
      res.push(convertCoords(d.geometry.coordinates[i][0], centx, centy, d.centroid, i > 0))
    }
  }

  return d3.geo.path().projection(null)({
    "type": "FeatureCollection",
    "features":[
      {
        "type":"Feature",
        "geometry":{
          "type":"Polygon",
          "coordinates": res
        },
      }
    ]
  })
}

export default CountryPolygon
