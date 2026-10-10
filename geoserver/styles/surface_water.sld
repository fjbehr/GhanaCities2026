<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer>
    <Name>surface_water</Name>
    <UserStyle>
      <Title>How often there was water, 1984–2021</Title>
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <ColorMap type="intervals">
              <ColorMapEntry color="#ffffff" quantity="1" opacity="0" label="Never water"/>
              <ColorMapEntry color="#e0f2fe" quantity="25" opacity="0.9" label="Rarely (under 25 % of the time)"/>
              <ColorMapEntry color="#7dd3fc" quantity="50" opacity="0.9" label="Sometimes (25–50 %)"/>
              <ColorMapEntry color="#38bdf8" quantity="75" opacity="0.9" label="Often (50–75 %)"/>
              <ColorMapEntry color="#0369a1" quantity="101" opacity="0.9" label="Almost always (75 % and more)"/>
              <ColorMapEntry color="#ffffff" quantity="256" opacity="0" label="No data"/>
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
