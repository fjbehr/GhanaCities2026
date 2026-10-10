<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer>
    <Name>heat</Name>
    <UserStyle>
      <Title>Hotter or cooler than the city average (surface, dry-season daytime)</Title>
      <!-- Values: °C difference from the city's median land surface temperature (Landsat) -->
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <Opacity>0.75</Opacity>
            <ColorMap type="intervals">
              <ColorMapEntry color="#ffffff" quantity="-9000" opacity="0" label="No data"/>
              <ColorMapEntry color="#2166ac" quantity="-4" label="4 °C or more cooler"/>
              <ColorMapEntry color="#67a9cf" quantity="-2" label="2–4 °C cooler"/>
              <ColorMapEntry color="#d1e5f0" quantity="-0.5" label="0.5–2 °C cooler"/>
              <ColorMapEntry color="#f7f7f7" quantity="0.5" opacity="0.35" label="About average"/>
              <ColorMapEntry color="#fddbc7" quantity="2" label="0.5–2 °C hotter"/>
              <ColorMapEntry color="#ef8a62" quantity="4" label="2–4 °C hotter"/>
              <ColorMapEntry color="#b2182b" quantity="1000" label="4 °C or more hotter"/>
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
