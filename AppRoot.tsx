import App from "./App";
import LocationProvider from "./src/context/LocationContext";
import RouteTrackingProvider from "./src/context/RouteTrackingContext";

export default function AppRoot() {
  return (
    <RouteTrackingProvider>
      <LocationProvider>
        <App />
      </LocationProvider>
    </RouteTrackingProvider>
  );
}
