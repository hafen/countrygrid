import d3 from 'd3'
import React from 'react'
import ReactDOM from 'react-dom'
import countryInclude from '../data/country-include'
import countryNames from '../data/world-country-names'
import stunt from '../data/stunting'
import debounce from 'debounce'
import CircularProgress from 'material-ui/lib/circular-progress'
import injectTapEventPlugin from 'react-tap-event-plugin'

var topojson = require('topojson')

var getHeight = () => {
  return window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight
}

var getWidth = () => {
  return window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth
}

var getScaleTranslate = (bounds, scaleFactor, translateFactor) => {
  var width = getWidth(),
    height = getHeight(),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = scaleFactor / Math.max(dx / width, dy / height),
    translate = [width / 2 - scale * x, (height * translateFactor) / 2 - scale * y]

  return {translate: translate, scale: scale, width: width, height: height}
}

var projection = d3.geo.mercator()

var path = d3.geo.path()
  .projection(projection)

var gridPadding = 5

// var legendColors = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84']
// var legendColors = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026']
var legendColors = ['#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84']

var colors = d3.scale.quantize()
  .domain([25, 60])
  .range(legendColors)

var WorldMap = React.createClass({
  getInitialState: function() {
    return {
      error: null,
      width: null,
      height: null,
      hoverName: null,
      zoomName: null,
      zoomed: false,
      gridView: false,
      gridProps: null
    }
  },
  componentDidMount: function() {
    // artificially delay the loading, so the loading state stays visible for a while.
    // setTimeout(this._loadData, 1000)
    this._loadData()
    window.addEventListener('resize', this._handleResize)
  },
  componentWillMount: function() {
    this._handleResize = debounce(this._handleResize, 200)
  },
  componentWillUnmount: function() {
    window.removeEventListener('resize', this._handleResize)
  },
  _handleResize: function() {
    var st = getScaleTranslate(this.state.bounds, 0.95, 0.9)
    var gp = getGridProps(this.state.xGridRange, this.state.yGridRange)

    this.setState({
      scale: st.scale,
      translate: st.translate,
      width: st.width,
      height: st.height,
      gridProps: gp})
  },
  _loadData: function() {
    d3.json("../dist/data/world-110m2.json", this._dataLoaded)
  },
  _dataLoaded: function(err, data) {
    if (err) return this.setState({error: err})

    var countries = topojson.feature(data, data.objects.countries).features
    var activeCountries = []
    var cnMap = d3.map(countryNames, function(d) {return d.id})
    var bounds
    var names = []
    for (var i = 0; i < countries.length; i++) {
      countries[i].name = cnMap.get([countries[i].id]).name
      countries[i].active = false
      countries[i].centroid = path.centroid(countries[i])
      if(countryInclude[countries[i].id]) {
        countries[i].active = true
        countries[i].gridx = countryInclude[countries[i].id].gridx
        countries[i].gridy = countryInclude[countries[i].id].gridy
        countries[i].stuntAvg = stunt[countries[i].id].avg
        countries[i].stuntTime = stunt[countries[i].id].data
        if(!bounds) {
          bounds = path.bounds(countries[i])
        } else {
          var tmp = path.bounds(countries[i])
          bounds[0][0] = Math.min(bounds[0][0], tmp[0][0])
          bounds[0][1] = Math.min(bounds[0][1], tmp[0][1])
          bounds[1][0] = Math.max(bounds[1][0], tmp[1][0])
          bounds[1][1] = Math.max(bounds[1][1], tmp[1][1])
        }
        activeCountries.push(countries[i])
      }
    }

    var st = getScaleTranslate(bounds, 0.95, 0.9)

    var xGridRange = d3.extent(activeCountries, function(d) { return d.gridx })
    var yGridRange = d3.extent(activeCountries, function(d) { return d.gridy })
    var gp = getGridProps(xGridRange, yGridRange)

    // window.countries = countries; window.cnMap = cnMap; window.activeCountries = activeCountries; window.countryInclude = countryInclude; window.path = path; window.bounds = bounds; window.projection = projection

    this.setState({map: countries,
      ac: activeCountries,
      bounds: bounds,
      scale: st.scale,
      translate: st.translate,
      width: st.width,
      height: st.height,
      xGridRange: xGridRange,
      yGridRange: yGridRange,
      gridProps: gp})
  },
  _hover: function(name) {
    this.setState({hoverName: name})
  },
  _clickZoom: function(d) {
    var zoomed = false
    if(d.background) {
      var st = getScaleTranslate(this.state.bounds, 0.95, 0.9)
    } else {
      var curBounds = path.bounds(d)
      var st = getScaleTranslate(this.state.bounds, 0.95, 0.9)
      if(d.active && (d.name !== this.state.zoomName || !this.state.zoomed)) {
        zoomed = true
        var st = getScaleTranslate(curBounds, 0.5, 1)
      }
    }
    this.setState({
      scale: st.scale,
      translate: st.translate,
      zoomed: zoomed,
      zoomName: zoomed ? d.name : null})
  },
  _toggleGrid: function(d) {
    this.setState({gridView: !this.state.gridView, zoomed: false, zoomName: null})
  },
  render: function() {
    if (this.state.error)
      return <div className={'message message--error'}>Error loading map data...</div>
    if (!this.state.map) {
      var style = {
        position: 'absolute',
        left: getWidth() / 2 - 50,
        top: getHeight() / 2 - 100
      }
      return <div style={style}>
          <CircularProgress mode="indeterminate" size={1.5} />
        </div>
    }

    var transform = 'translate(' + this.state.translate + ')scale(' + this.state.scale + ')'

    var w = 50
    var legend = {
      left: this.state.width - legendColors.length * w - 10,
      top: this.state.height - 35,
      height: 15,
      entryWidth: w
    }

    return (
      <svg id='worldMap' ref='worldMap' width={this.state.width} height={this.state.height}>
        <g>
          <rect width={this.state.width} height={this.state.height} className='map-background' onClick={!this.state.gridView && this._clickZoom.bind(this, {background: true})} />
        </g>
        <g>
          {this.state.map.map((d) => {
            return <CountryPolygon key={d.id} k={d.id} d={d}
            transform={transform} scale={this.state.scale}
            zoomed={this.state.zoomed} grid={this.state.gridProps}
            gridView={this.state.gridView}
            clickZoom={this._clickZoom} hover={this._hover} />
          })}
          {this.state.map.map((d, i) => {
            if(d.name === this.state.hoverName && !this.state.gridView) {
              return <CountryLabel key={d.name} active={d.active}
                zoomed={this.state.zoomed} stuntAvg={d.stuntAvg}
                scale={this.state.scale} transform={transform}
                name={d.name} hoverName={this.state.hoverName}
                centroid={d.centroid} />
            }
            if(this.state.gridView && d.gridx) {
              return <CountryGridLabel key={'gl-' + d.name}
                name={d.name} grid={this.state.gridProps}
                gx={d.gridx} gy={d.gridy} />
            }
          })}
          {this.state.map.map((d, i) => {
            if(this.state.gridView && d.gridx) {
              return <CountryGridPlot key={'glplt-' + d.name}
                name={d.name} grid={this.state.gridProps}
                gx={d.gridx} gy={d.gridy} d={d.stuntTime} />
            }
          })}
        </g>
        <g>
          <text x='5' y='18'>Map / Grid Prototype</text>
        </g>
        <g>
          <text x='5' y={this.state.height - 10} className='toggle-text'>Click to toggle grid / map</text>
          <rect x='2' y={this.state.height - 26} width='185' height='22' onClick={this._toggleGrid} className='toggle-box' />
        </g>
        <g>
          <text x={legend.left} y={legend.top - 8} className='legend-text'>Average percent stunting - children under 5 (1995 - 2014)</text>
          <rect x={legend.left} y={legend.top} height={legend.height} width={legendColors.length * legend.entryWidth} fill='#ffffff' />
          {legendColors.map((d, i) => {
            return <rect key={'legend-' + i} x={legend.left + i * legend.entryWidth} y={legend.top} height={legend.height} width={legend.entryWidth} fill={d} opacity='0.65' />
          })}
          {legendColors.map((d, i) => {
            var label = colors.invertExtent(d).toString().replace(",", " - ")
            return <text key={'legend-lbl-' + i} x={legend.left + i * legend.entryWidth} y={legend.top + legend.height + 12} className='legend-lbl-text'>{label}</text>
          })}
        </g>
      </svg>
    )
  }
})

var D3PROPS = {
  transformDuration: 1000
}

var polyStrokeWidth = (scale, zoomed) => {
  return 1 / scale * (zoomed ? 2 : 0.5)
}

var CountryPolyD3 = {}

CountryPolyD3.enter = (props, selection) => {
  var color = props.d.stuntAvg ? colors(props.d.stuntAvg) : '#ddd'
  // var hcolor = d3.hsl(color).darker(0.4).toString()
  // console.log(color)

  selection.select('path')
    .property({mapView: true})
    .attr('d', path(props.d))
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
  var mapView = selection.select('path').property('mapView')

  if(!props.gridView) {
    if(props.zoomed) {
      selection.select('path')
        .transition().duration(D3PROPS.transformDuration)
        .attr('transform', props.transform)
        .style('stroke-width', polyStrokeWidth(props.scale, props.zoomed))
    } else if(mapView) {
      selection.select('path')
        .transition().duration(D3PROPS.transformDuration)
        .attr('transform', props.transform)
        .style('stroke-width', polyStrokeWidth(props.scale, props.zoomed))
    } else {
      selection.select('path')
        .property({mapView: true})

      selection.select('path.country')
        .transition().duration(1000)
        .delay(1500)
        .attr('transform', props.transform)
        .style('opacity', '1')
        .style('stroke-width', polyStrokeWidth(props.scale, props.zoomed))

      selection.select('path.active-country')
        .transition().duration(2000)
        .attr('transform', props.transform)
        .attr('d', path(props.d))
        .style('stroke-width', polyStrokeWidth(props.scale, props.zoomed))
    }
  } else {
    selection.select('path')
      .property({mapView: false})

    var gridPath = getSquarePath(props.d, props.grid, projection)

    selection.select('path.country')
      .transition().duration(1000)
      .style('opacity', '0')

    selection.select('path.active-country')
      .transition().duration(2000)
      .attr('transform', 'translate(0)scale(1)')
      .attr('d', gridPath)
      .style('stroke-width', 2)
  }
}

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
    return nextProps.transform !== this.props.transform || nextProps.gridView !== this.props.gridView
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
    if(!this.props.gridView) {
      this.props.clickZoom(d)
    }
  },
  render: function() {
    var className = this.props.d.active ? 'active-country' : 'country'

    return(
      <g>
        <path
          className={className}
          onMouseOver={this._mouseOver.bind(this, this.props.d.name)}
          onMouseOut={this._mouseOut.bind(this, null)}
          onClick={this._mouseClick.bind(this, this.props.d)}
        />
      </g>
    )
  }
})

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
    .transition().duration(D3PROPS.transformDuration)
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
      fill: this.props.active ? "black" : "#777",
      pointerEvents: 'none'
    }

    var avgTextStyle = {
      fontSize: '6px',
      pointerEvents: 'none'
    }

    var stuntAvg = null
    if(this.props.stuntAvg) {
      stuntAvg = <text style={avgTextStyle} textAnchor='middle'
        x={this.props.centroid[0]}
      >
        {Math.round(this.props.stuntAvg) + '%'}
      </text>
    }
    var name = this.props.stuntAvg ? this.props.name + ' - ' + Math.round(this.props.stuntAvg) + '%' : this.props.name
    return(
      <g>
        <text style={textStyle} textAnchor='middle'>{name}</text>
      </g>
    )
  }
})

var CountryGridLabelD3 = {}
CountryGridLabelD3.enter = (props, selection) => {
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

CountryGridLabelD3.update = (props, selection) => {
  var grid = props.grid
  var tx = (props.gx - 1) * grid.binSize + grid.padx + 4
  var ty = (props.gy - 1) * grid.binSize + grid.pady + 12 + 3

  selection.select('text')
    .transition().duration(2000)
    .attr('x', tx)
    .attr('y', ty)
}

var CountryGridLabel = React.createClass({
  componentDidMount: function() {
    this.d3Node = d3.select(ReactDOM.findDOMNode(this))
    this.d3Node.call(CountryGridLabelD3.enter.bind(this, this.props))
  },
  componentDidUpdate() {
    this.d3Node.call(CountryGridLabelD3.update.bind(this, this.props))
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

var CountryGridPlotD3 = {}
CountryGridPlotD3.enter = (props, selection) => {
  makeGridPlot(props, selection, 2000)
}

CountryGridPlotD3.update = (props, selection) => {
  selection.selectAll('*').remove()
  setTimeout(function() {
    makeGridPlot(props, selection, 0)
  }, 2100)
}

var CountryGridPlot = React.createClass({
  componentDidMount: function() {
    this.d3Node = d3.select(ReactDOM.findDOMNode(this))
    this.d3Node
      .call(CountryGridPlotD3.enter.bind(this, this.props))
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    if(JSON.stringify(nextProps.grid) !== JSON.stringify(this.props.grid) ||
    JSON.stringify(nextProps.d) !== JSON.stringify(this.props.d) ||
    nextProps.gx !== this.props.gx ||
    nextProps.gy !== this.props.gy) {
      this.d3Node.call(CountryGridPlotD3.update.bind(this, nextProps))
    }
    return false
  },
  render: function() {
    var grid = this.props.grid
    var tx = (this.props.gx - 1) * grid.binSize + grid.padx + 4
    var ty = (this.props.gy - 1) * grid.binSize + grid.pady + 12 + 3

    var xr = d3.scale.linear().domain([1992, 2017]).range([tx, tx + grid.binSize]),
        yr = d3.scale.linear().domain([0, 80]).range([ty + grid.binSize, ty])

        // {this.props.d.map((dd, i) => {
        //   return <circle cx={xr(dd.x)} cy={yr(dd.y)} r='3' />
        // })}

    return(
      <g>
      </g>
    )
  }
})



export default WorldMap

var getSquarePath = (d, grid, projection) => {
  if(!d.gridx) {
    return ''
  }

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

    var startCoords = projection(coords[0])
    var startAngle = (getAngle(startCoords, centroid) + 2 * Math.PI) % (2 * Math.PI)
    var angleDelta = 2 * Math.PI / nn
    for (var i = 0; i < nn; i++) {
      // curCoords = projection(coords[i])
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

  var centx = (d.gridx - 1) * grid.binSize + grid.padx + grid.binSize / 2
  var centy = (d.gridy - 1) * grid.binSize + grid.pady + grid.binSize / 2

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

var getGridProps = (xrange, yrange) => {
  var hh = getHeight()
  var ww = getWidth()
  var grid = {}
  grid.binSize = Math.min((ww - gridPadding * 2) / xrange[1],
    (hh - gridPadding * 2) / yrange[1])
  grid.fontStyle = {fontSize: Math.min(grid.binSize * 0.15, 12) + 'px'}
  grid.padx = (ww - (xrange[1] * grid.binSize)) / 2
  grid.pady = (hh - (yrange[1] * grid.binSize)) / 2
  return grid
}
