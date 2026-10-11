<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer>
    <Name>landcover</Name>
    <UserStyle>
      <Title>Land cover 2021 (ESA WorldCover)</Title>
      <!-- ESA WorldCover class colours, except built-up: neutral grey instead of ESA red, so a built-up city does not read as an alarm -->
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <Opacity>0.75</Opacity>
            <ColorMap type="values">
              <ColorMapEntry color="#000000" quantity="0" opacity="0" label="No data"/>
              <ColorMapEntry color="#006400" quantity="10" label="Tree cover"/>
              <ColorMapEntry color="#ffbb22" quantity="20" label="Shrubland"/>
              <ColorMapEntry color="#ffff4c" quantity="30" label="Grassland"/>
              <ColorMapEntry color="#f096ff" quantity="40" label="Cropland"/>
              <ColorMapEntry color="#5b5f66" quantity="50" label="Built-up"/>
              <ColorMapEntry color="#b4b4b4" quantity="60" label="Bare / sparse vegetation"/>
              <ColorMapEntry color="#0064c8" quantity="80" label="Permanent water"/>
              <ColorMapEntry color="#0096a0" quantity="90" label="Herbaceous wetland"/>
              <ColorMapEntry color="#00cf75" quantity="95" label="Mangroves"/>
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
