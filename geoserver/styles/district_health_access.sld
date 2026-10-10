<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer>
    <Name>district_health_access</Name>
    <UserStyle>
      <Title>Residents within 2 km of a health facility</Title>
      <FeatureTypeStyle>
        <Rule>
          <Title>Under 50 %</Title>
          <ogc:Filter><ogc:PropertyIsLessThan><ogc:PropertyName>health_2km_pct</ogc:PropertyName><ogc:Literal>50</ogc:Literal></ogc:PropertyIsLessThan></ogc:Filter>
          <PolygonSymbolizer><Fill><CssParameter name="fill">#eff6ff</CssParameter><CssParameter name="fill-opacity">0.75</CssParameter></Fill><Stroke><CssParameter name="stroke">#334155</CssParameter><CssParameter name="stroke-width">0.8</CssParameter></Stroke></PolygonSymbolizer>
        </Rule>
        <Rule>
          <Title>50–70 %</Title>
          <ogc:Filter><ogc:PropertyIsBetween><ogc:PropertyName>health_2km_pct</ogc:PropertyName><ogc:LowerBoundary><ogc:Literal>50</ogc:Literal></ogc:LowerBoundary><ogc:UpperBoundary><ogc:Literal>69.99</ogc:Literal></ogc:UpperBoundary></ogc:PropertyIsBetween></ogc:Filter>
          <PolygonSymbolizer><Fill><CssParameter name="fill">#bfdbfe</CssParameter><CssParameter name="fill-opacity">0.75</CssParameter></Fill><Stroke><CssParameter name="stroke">#334155</CssParameter><CssParameter name="stroke-width">0.8</CssParameter></Stroke></PolygonSymbolizer>
        </Rule>
        <Rule>
          <Title>70–85 %</Title>
          <ogc:Filter><ogc:PropertyIsBetween><ogc:PropertyName>health_2km_pct</ogc:PropertyName><ogc:LowerBoundary><ogc:Literal>70</ogc:Literal></ogc:LowerBoundary><ogc:UpperBoundary><ogc:Literal>84.99</ogc:Literal></ogc:UpperBoundary></ogc:PropertyIsBetween></ogc:Filter>
          <PolygonSymbolizer><Fill><CssParameter name="fill">#60a5fa</CssParameter><CssParameter name="fill-opacity">0.75</CssParameter></Fill><Stroke><CssParameter name="stroke">#334155</CssParameter><CssParameter name="stroke-width">0.8</CssParameter></Stroke></PolygonSymbolizer>
        </Rule>
        <Rule>
          <Title>85–95 %</Title>
          <ogc:Filter><ogc:PropertyIsBetween><ogc:PropertyName>health_2km_pct</ogc:PropertyName><ogc:LowerBoundary><ogc:Literal>85</ogc:Literal></ogc:LowerBoundary><ogc:UpperBoundary><ogc:Literal>94.99</ogc:Literal></ogc:UpperBoundary></ogc:PropertyIsBetween></ogc:Filter>
          <PolygonSymbolizer><Fill><CssParameter name="fill">#2563eb</CssParameter><CssParameter name="fill-opacity">0.75</CssParameter></Fill><Stroke><CssParameter name="stroke">#334155</CssParameter><CssParameter name="stroke-width">0.8</CssParameter></Stroke></PolygonSymbolizer>
        </Rule>
        <Rule>
          <Title>95 % and more</Title>
          <ogc:Filter><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>health_2km_pct</ogc:PropertyName><ogc:Literal>95</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:Filter>
          <PolygonSymbolizer><Fill><CssParameter name="fill">#1e3a8a</CssParameter><CssParameter name="fill-opacity">0.75</CssParameter></Fill><Stroke><CssParameter name="stroke">#334155</CssParameter><CssParameter name="stroke-width">0.8</CssParameter></Stroke></PolygonSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
