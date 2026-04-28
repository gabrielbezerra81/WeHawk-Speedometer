import Geolocation, {
  GeolocationResponse,
} from "@react-native-community/geolocation";
import { PropsWithChildren, useEffect, useRef } from "react";
import { createContext, useContextSelector } from "use-context-selector";
import { RouteTrackingContext } from "./RouteTrackingContext";

export const LocationContext = createContext({});

const LocationProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const status = useContextSelector(RouteTrackingContext, (s) => s.status);
  const setStartLocation = useContextSelector(
    RouteTrackingContext,
    (s) => s.setStartLocation,
  );
  const setLatestLocation = useContextSelector(
    RouteTrackingContext,
    (s) => s.setLatestLocation,
  );
  const latestLocation = useContextSelector(
    RouteTrackingContext,
    (s) => s.latestLocation,
  );
  const setLocations = useContextSelector(
    RouteTrackingContext,
    (s) => s.setLocations,
  );
  const setMaxSpeed = useContextSelector(
    RouteTrackingContext,
    (s) => s.setMaxSpeed,
  );

  const subscriptionRef = useRef<number | null>(null);

  function changeMaxSpeed(current: number | null) {
    setMaxSpeed((previous) => {
      if (current === null) {
        return previous;
      }

      if (previous === null) {
        return current;
      }

      if (current > previous) {
        return current;
      }

      return previous;
    });
  }

  // get initial and start tracking
  useEffect(() => {
    async function getInitialLocation() {
      Geolocation.requestAuthorization(
        () => {
          Geolocation.getCurrentPosition(
            (position) => {
              setStartLocation(position);
            },
            (error) => {
              console.log("get position error", error);
            },
            { enableHighAccuracy: true },
          );
        },
        (error) => {
          console.log("request location error", error);
        },
      );
    }

    async function startInitialTracking() {
      subscriptionRef.current = Geolocation.watchPosition(
        (latest) => {
          console.log("latest", latest.coords);
          setLatestLocation(latest);
          changeMaxSpeed(latest.coords.speed);
        },
        (error) => {
          console.log("watch error", error);
        },
        { interval: 500, enableHighAccuracy: true, distanceFilter: 5 },
      );
    }

    getInitialLocation();
    startInitialTracking();

    return () => {
      if (subscriptionRef.current) {
        Geolocation.clearWatch(subscriptionRef.current);
      }
    };
  }, []);

  // add new locations when running
  useEffect(() => {
    if (status === "running" && latestLocation) {
      setLocations((loc) => {
        if (loc.some((item) => item.timestamp === latestLocation.timestamp)) {
          return loc;
        }

        return [...loc, latestLocation];
      });
    }
  }, [latestLocation, status]);

  return (
    <LocationContext.Provider value={{}}>{children}</LocationContext.Provider>
  );
};

export default LocationProvider;
