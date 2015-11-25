import d3 from 'd3'
import React from 'react'
import ReactDOM from 'react-dom'
import countryInclude from '../data/country-include'
import countryNames from '../data/world-country-names'
import stunt from '../data/stunting'
import debounce from 'debounce'
import CircularProgress from 'material-ui/lib/circular-progress'
import injectTapEventPlugin from 'react-tap-event-plugin'

import CountryPolygon from './country-polygon'
import CountryLabel from './country-label'
import GeoGrid from './geo-grid'
import GeoGridLabel from './geo-grid-label'
import ClusterGrid from './cluster-grid'
import Legend from './legend'
import ToggleControl from './toggle-control'
import consts from '../constants/constants'

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
  var width   = getWidth(),
    height    = getHeight(),
    dx        = bounds[1][0] - bounds[0][0],
    dy        = bounds[1][1] - bounds[0][1],
    x         = (bounds[0][0] + bounds[1][0]) / 2,
    y         = (bounds[0][1] + bounds[1][1]) / 2,
    scale     = scaleFactor / Math.max(dx / width, dy / height),
    translate = [width / 2 - scale * x, (height * translateFactor) / 2 - scale * y]

  return {translate: translate, scale: scale, width: width, height: height}
}

var WorldMap = React.createClass({
  getInitialState: function() {
    return {
      error     : null,
      width     : null,
      height    : null,
      hoverName : null,
      zoomName  : null,
      zoomed    : false,
      viewMode  : 'map',
      gridProps : null
    }
  },
  componentDidMount: function() {
    // artificially delay the loading
    // so the loading state stays visible for a while.
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
    var cgp = getClusterGridProps(this.state.ac)

    this.setState({
      scale        : st.scale,
      translate    : st.translate,
      width        : st.width,
      height       : st.height,
      gridProps    : gp,
      clGridCoords : cgp.clusterGridCoords,
      clGridProps  : cgp.grid})
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
      countries[i].name     = cnMap.get([countries[i].id]).name
      countries[i].active   = false
      countries[i].centroid = consts.path.centroid(countries[i])
      if(countryInclude[countries[i].id]) {
        countries[i].active    = true
        countries[i].gridx     = countryInclude[countries[i].id].gridx
        countries[i].gridy     = countryInclude[countries[i].id].gridy
        countries[i].cluster   = countryInclude[countries[i].id].cluster
        countries[i].stuntAvg  = stunt[countries[i].id].avg
        countries[i].stuntTime = stunt[countries[i].id].data
        if(!bounds) {
          bounds = consts.path.bounds(countries[i])
        } else {
          var tmp = consts.path.bounds(countries[i])
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

    var cgp = getClusterGridProps(activeCountries)

    window.countries = countries; window.cnMap = cnMap; window.activeCountries = activeCountries; window.countryInclude = countryInclude; window.bounds = bounds;

    this.setState({
      map          : countries,
      ac           : activeCountries,
      bounds       : bounds,
      scale        : st.scale,
      translate    : st.translate,
      width        : st.width,
      height       : st.height,
      xGridRange   : xGridRange,
      yGridRange   : yGridRange,
      gridProps    : gp,
      clGridCoords : cgp.clusterGridCoords,
      clGridProps  : cgp.grid})
  },
  _hover: function(name) {
    this.setState({hoverName: name})
  },
  _clickZoom: function(d) {
    var zoomed = false
    if(d.background) {
      var st = getScaleTranslate(this.state.bounds, 0.95, 0.9)
    } else {
      var curBounds = consts.path.bounds(d)
      var st = getScaleTranslate(this.state.bounds, 0.95, 0.9)
      if(d.active && (d.name !== this.state.zoomName || !this.state.zoomed)) {
        zoomed = true
        var st = getScaleTranslate(curBounds, 0.5, 1)
      }
    }
    this.setState({
      scale     : st.scale,
      translate : st.translate,
      zoomed    : zoomed,
      zoomName  : zoomed ? d.name : null})
  },
  _toggleGrid: function(d) {
    this.setState({
      viewMode : d.target.value,
      zoomed   : false,
      zoomName : null})
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

    var legend = null
    if(this.state.viewMode !== 'clusterGrid')
      legend = <Legend
          left       = {this.state.width - consts.legendColors.length * 50 - 10}
          top        = {this.state.height - 35}
          height     = {15}
          entryWidth = {50}
        />

    return (
      <div>
      <svg id='worldMap' ref='worldMap' width={this.state.width} height={this.state.height}>
        <g>
          <rect
            width     = {this.state.width}
            height    = {this.state.height}
            className = 'map-background'
            onClick   = {this.state.viewMode === 'map' && this._clickZoom.bind(this, {background: true})}
          />
        </g>
        <g>
          {this.state.map.map((d) => {
            return <CountryPolygon
              key       = {d.id}
              k         = {d.id}
              d         = {d}
              transform = {transform}
              scale     = {this.state.scale}
              zoomed    = {this.state.zoomed}
              grid      = {this.state.gridProps}
              clgridcrd = {this.state.clGridCoords[d.id]}
              clgrid    = {this.state.clGridProps}
              viewMode  = {this.state.viewMode}
              clickZoom = {this._clickZoom}
              hover     = {this._hover}
            />
          })}
          {this.state.map.map((d, i) => {
            if(d.name === this.state.hoverName && this.state.viewMode === 'map') {
              return <CountryLabel
                key       = {d.name}
                active    = {d.active}
                zoomed    = {this.state.zoomed}
                stuntAvg  = {d.stuntAvg}
                scale     = {this.state.scale}
                transform = {transform}
                name      = {d.name}
                hoverName = {this.state.hoverName}
                centroid  = {d.centroid}
              />
            }
            if(this.state.viewMode === 'geoGrid' && d.gridx) {
              return <GeoGridLabel
                key  = {'gl-' + d.name}
                name = {d.name}
                grid = {this.state.gridProps}
                gx   = {d.gridx}
                gy   = {d.gridy}
              />
            }
          })}
          {this.state.map.map((d, i) => {
            if(this.state.viewMode === 'geoGrid' && d.gridx) {
              return <GeoGrid
                key  = {'glplt-' + d.name}
                name = {d.name}
                grid = {this.state.gridProps}
                gx   = {d.gridx}
                gy   = {d.gridy}
                d    = {d.stuntTime}
              />
            }
          })}
        </g>
        {legend}
      </svg>
      <ToggleControl toggleGrid = {this._toggleGrid} />
      </div>
    )
  }
})

export default WorldMap

var getGridProps = (xrange, yrange) => {
  var hh = getHeight()
  var ww = getWidth()
  var grid = {}
  grid.binSize = Math.min((ww - consts.gridPadding * 2) / xrange[1],
    (hh - consts.gridPadding * 2) / yrange[1])
  grid.fontStyle = {fontSize: Math.min(grid.binSize * 0.15, 12) + 'px'}
  grid.padx = (ww - (xrange[1] * grid.binSize)) / 2
  grid.pady = (hh - (yrange[1] * grid.binSize)) / 2
  return grid
}

var getClusterGridProps = (activeCountries) => {
  var hh = getHeight() - 225
  var ww = getWidth() - 10

  // build data structure of cluster grid
  var clusters = {}
  for (var i = 0; i < activeCountries.length; i++) {
    if(!clusters[activeCountries[i].cluster])
      clusters[activeCountries[i].cluster] = []

    clusters[activeCountries[i].cluster].push(i)
  }

  var ncl = Object.keys(clusters).length // number of clusters
  var nn = activeCountries.length // + ncl
  var rc = getOptimalGridRowCol(nn, hh, ww)

  // loop over all clusters and set row and column for associated countries
  var curRow = 0, curCol = 0
  var clusterGridCoords = {}
  for(var key in clusters) {
    // // this is to leave a blank space at the beginning of each cluster
    // curRow++
    // if(curRow >= rc.nr) {
    //   curRow = 0
    //   curCol ++
    // }
    for(var cidx of clusters[key]) {
      // console.log(' ' + cidx + ' ' + curRow + ' ' + curCol)
      clusterGridCoords[activeCountries[cidx].id] = {
        gridx : curCol + 1,
        gridy : curRow + 1
      }
      curRow++
      if(curRow >= rc.nr) {
        curRow = 0
        curCol ++
      }
    }
  }

  var grid = {}
  grid.binSize = Math.min(ww / rc.nc, hh / rc.nr)
  grid.fontStyle = {fontSize: Math.min(grid.binSize * 0.15, 12) + 'px'}
  grid.padx = (ww + 10 - (rc.nc * grid.binSize)) / 2
  grid.pady = 25

  return { grid : grid, clusterGridCoords : clusterGridCoords }
}

var getOptimalGridRowCol = (nn, hh, ww) => {
  var nr, nc

  var l0 = Math.sqrt(ww * hh / nn)
  var c0 = Math.ceil(ww / l0)
  var r0 = Math.ceil(hh / l0)

  // console.log(Math.ceil(nn / c0) + ' ' + c0)
  // console.log(r0 + ' ' + Math.ceil(nn / r0))

  // calculate resulting box size and choose the one that give the largest
  var binSize1 = Math.min(ww / c0, hh / Math.ceil(nn / c0))
  var binSize2 = Math.min(ww / Math.ceil(nn / r0), hh / r0)

  if(binSize1 > binSize2) {
    nr = Math.ceil(nn / c0)
    nc = c0
  } else {
    nr = r0
    nc = Math.ceil(nn / r0)
  }

  return({nr: nr, nc: nc})
}
