<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer>
    <Name>district_outline</Name>
    <UserStyle>
      <Title>District boundaries</Title>
      <FeatureTypeStyle>
        <Rule>
          <Title>District (MMDA)</Title>
          <PolygonSymbolizer>
            <Stroke><CssParameter name="stroke">#334155</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke>
          </PolygonSymbolizer>
        </Rule>
        <Rule>
          <MaxScaleDenominator>150000</MaxScaleDenominator>
          <TextSymbolizer>
            <Label><ogc:PropertyName>name</ogc:PropertyName></Label>
            <Font><CssParameter name="font-family">SansSerif</CssParameter><CssParameter name="font-size">12</CssParameter></Font>
            <Halo><Radius>2</Radius><Fill><CssParameter name="fill">#ffffff</CssParameter></Fill></Halo>
            <Fill><CssParameter name="fill">#0f172a</CssParameter></Fill>
            <VendorOption name="autoWrap">90</VendorOption>
            <VendorOption name="maxDisplacement">40</VendorOption>
          </TextSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
