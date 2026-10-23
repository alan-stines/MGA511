# MGA Campus Traffic Watch

Map-first local prototype for Middle Georgia State University Public Safety. Includes Macon, Warner Robins, Cochran, Dublin, and Eastman, county boundaries, campus proximity filters (5/15/30 straight-line miles), traffic categories, search, and separate statewide/regional notices.

## Run

Requires Node.js 22 or newer. No npm dependencies or installation needed.

```powershell
npm start
```

Open http://localhost:5110. Without a key, the server returns clearly labeled fictional scenarios. To enable GDOT, copy `.env.example` to `.env`, set `GDOT_API_KEY`, and restart. Never put the key in frontend code. Run `npm test` for feed checks.

## Integration

The server calls the official `/api/v2/get/event` and `/api/v2/get/alerts` endpoints. Two requests per shared 60-second cache cycle stay below the documented ten requests per minute for a single server process. Concurrent viewers share requests. Failed updates retain the previous response with a stale indicator; failed first connections never substitute demo data. Multiple deployed instances would require a shared cache/rate limiter. General notices lack coordinates and are shown separately with their GDOT region labels, without claiming campus relevance.

Events are initially limited to a regional bounding box (31.8–33.25 N, 84.25–82.35 W), then filtered by distance to campuses. Proximity is straight-line distance, not a routing or jurisdiction determination. Full closures appear first; GDOT severity codes are not interpreted without a confirmed mapping.

## Geography and sources

- Campus addresses: https://www.mga.edu/about/maps.php. Coordinates are approximate seed locations and must be verified with Public Safety before operational use, especially the Eastman aviation campus.
- County geometries: https://github.com/plotly/datasets/blob/master/geojson-counties-fips.json (Census-derived county data). Coverage is Bibb, Houston, Bleckley, Laurens, Dodge and their directly adjacent counties (20 total), selected using shared boundary vertices. Static boundaries may not reflect later administrative changes.
- Map: OpenStreetMap standard tiles clipped to county polygons, with county outlines, names, campuses and traffic markers. Pan and minimum zoom limits keep the map in this region. Only visible tiles intersecting the coverage are requested; no world map, bulk downloading, or offline prefetching. Boundary tiles are rectangular downloads but are displayed only within county outlines. No map API key required. OSM tile service is best-effort and subject to https://operations.osmfoundation.org/policies/tiles/. Leaflet 1.9.4 loads from unpkg and fonts from Google Fonts; these assets and map tiles require internet access.
- GDOT API: https://511ga.org/developers/doc, https://511ga.org/help/endpoint/event, https://511ga.org/help/endpoint/alerts.

## Before operational deployment

Validate campus pins, desired county coverage and alert regions with officials; test actual API responses once the key arrives. This prototype binds to localhost. Choose hosting, access controls, monitoring and shared cache strategy before serving it to multiple workstations. No dispatch, notifications, incident acknowledgements, or historical storage are implemented.
