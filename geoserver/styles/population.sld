<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer>
    <Name>population</Name>
    <UserStyle>
      <Title>Residents per 100 m cell (WorldPop 2025)</Title>
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <Opacity>0.8</Opacity>
            <ColorMap type="intervals">
              <ColorMapEntry color="#000000" quantity="0.5" opacity="0" label="No residents"/>
              <ColorMapEntry color="#fef3c7" quantity="10" label="Up to 10"/>
              <ColorMapEntry color="#fcd34d" quantity="50" label="10–50"/>
              <ColorMapEntry color="#f59e0b" quantity="150" label="50–150"/>
              <ColorMapEntry color="#d97706" quantity="400" label="150–400"/>
              <ColorMapEntry color="#92400e" quantity="1000000" label="More than 400"/>
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
