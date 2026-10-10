<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer>
    <Name>built</Name>
    <UserStyle>
      <Title>Built-up share of each ~90 m cell (GHSL)</Title>
      <!-- Values are m² of built surface per 3-arcsecond cell (~8 500 m² at Ghana's latitudes) -->
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <Opacity>0.85</Opacity>
            <ColorMap type="intervals">
              <ColorMapEntry color="#ffffff" quantity="100" opacity="0" label="Not built up"/>
              <ColorMapEntry color="#e2e8f0" quantity="1000" label="Up to 12 %"/>
              <ColorMapEntry color="#94a3b8" quantity="3000" label="12–35 %"/>
              <ColorMapEntry color="#475569" quantity="6000" label="35–70 %"/>
              <ColorMapEntry color="#1e293b" quantity="65535" label="More than 70 %"/>
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
