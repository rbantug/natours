/* eslint-disable no-undef */

// eslint-disable-next-line no-undef
const location1 = JSON.parse(document.getElementById('map').dataset.locations);
console.log(location1);

mapboxgl.accessToken =
  'pk.eyJ1IjoibGlsb2tpZTEyIiwiYSI6ImNrbDNnaW9lOTA0YzUybm4xdm00dXR6c20ifQ.IAEMS8teAMb8wroY2eTBoA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/lilokie12/ckl43a105305d17pm6uyox6bi',
  scrollZoom: false,
  // center: [-115.570154, 51.178456],
  // zoom: 5,
});

const bound = new mapboxgl.LngLatBounds();

location1.forEach((el) => {
  // create marker
  const newElement = document.createElement('div');
  newElement.className = 'marker';

  // Add Marker
  new mapboxgl.Marker({
    element: newElement,
    anchor: 'bottom',
  })
    .setLngLat(el.coordinates)
    .addTo(map);

  // Add pop up description
  new mapboxgl.Popup({ 
    offset: 30,
    closeOnClick: false, 
  })
    .setLngLat(el.coordinates)
    .setHTML(`<p>Day ${el.day}: ${el.description}</p>`)
    .addTo(map);

  // Extend map bound to include current locations
  bound.extend(el.coordinates);
});

map.fitBounds(bound, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
});
