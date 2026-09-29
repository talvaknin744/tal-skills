# Static asset path change

The browser currently loads a page at /docs/guide/index.html. That page references ../../assets/icons/info.svg, which resolves to /assets/icons/info.svg. We will move the icon to /assets/ui/icons/info.svg and leave the page URL unchanged. The proposed edit keeps ../../assets/icons/info.svg as the reference. The build copies assets without rewriting relative URLs. Only this icon moves; all requests are ordinary static GETs.
