<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer>
    <Name>low_lying</Name>
    <UserStyle>
      <Title>Low-lying areas</Title>
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <ColorMap type="values">
              <ColorMapEntry color="#ffffff" quantity="0" opacity="0" label="Not low-lying"/>
              <ColorMapEntry color="#1d4ed8" quantity="1" opacity="0.5" label="Low-lying: 5 m or more below the surroundings (within ~500 m)"/>
              <ColorMapEntry color="#ffffff" quantity="255" opacity="0" label="No data"/>
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
