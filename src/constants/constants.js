import d3 from 'd3'

var gridPadding = 5

// var legendColors = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84']
// var legendColors = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026']
var legendColors = ['#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84']

var colors = d3.scale.quantize()
  .domain([25, 60])
  .range(legendColors)

var tableau10 = ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728',
  '#9467BD', '#8C564B', '#E377C2', '#7F7F7F', '#BCBD22', '#17BECF']

var projection = d3.geo.mercator()

var path = d3.geo.path()
  .projection(projection)

var consts = {
  gridPadding: 5,
  transformDuration: 1000,
  colors: colors,
  legendColors: legendColors,
  clusterColors: tableau10,
  projection: projection,
  path: path
}

export default consts
