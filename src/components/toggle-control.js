import React from 'react'
import RadioButton from 'material-ui/lib/radio-button'
import RadioButtonGroup from 'material-ui/lib/radio-button-group'

var ToggleControl = React.createClass({
  render() {
    var style = {
      position : 'absolute',
      left     : 10,
      bottom   : 10,
      width    : 200
    }

    return (
      <div style = {style}>
        <RadioButtonGroup
          name            = 'view'
          defaultSelected = 'map'
          onChange        = {this.props.toggleGrid}
        >
          <RadioButton
            value     = 'map'
            label     = 'Map'
            style     = {{marginBottom: 5}}
            iconStyle = {{marginRight: 8}}
          />
          <RadioButton
            value     = 'geoGrid'
            label     = 'Geo Grid'
            style     = {{marginBottom: 5}}
            iconStyle = {{marginRight: 8}}
          />
          <RadioButton
            value     = 'clusterGrid'
            label     = 'Cluster Grid'
            iconStyle = {{marginRight: 8}}
          />
        </RadioButtonGroup>
      </div>
    )
  }
})

export default ToggleControl
