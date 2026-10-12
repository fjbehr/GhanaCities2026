<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer>
    <Name>region_outline</Name>
    <UserStyle>
      <Title>Region boundaries</Title>
      <FeatureTypeStyle>
        <Rule>
          <Title>Region</Title>
          <PolygonSymbolizer>
            <Stroke><CssParameter name="stroke">#0f172a</CssParameter><CssParameter name="stroke-width">2.5</CssParameter></Stroke>
          </PolygonSymbolizer>
        </Rule>
        <Rule>
          <MaxScaleDenominator>4000000</MaxScaleDenominator>
          <TextSymbolizer>
            <Label><ogc:PropertyName>name</ogc:PropertyName></Label>
            <Font><CssParameter name="font-family">SansSerif</CssParameter><CssParameter name="font-size">14</CssParameter><CssParameter name="font-weight">bold</CssParameter></Font>
            <Halo><Radius>2</Radius><Fill><CssParameter name="fill">#ffffff</CssParameter></Fill></Halo>
            <Fill><CssParameter name="fill">#0f172a</CssParameter></Fill>
            <VendorOption name="autoWrap">120</VendorOption>
            <VendorOption name="maxDisplacement">60</VendorOption>
          </TextSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
