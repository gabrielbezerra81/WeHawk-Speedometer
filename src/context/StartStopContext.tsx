import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { createContext } from "use-context-selector";

type CurrentRouteStatus = "running" | "paused" | "stopped";

import Geolocation, {
  GeolocationResponse,
} from "@react-native-community/geolocation";

interface Route {
  id: number;
  duration: number;
  startTime: number;
  endTime: number;
  maxSpeed: number;
  locations: Array<GeolocationResponse>;
  stoppedTime: number;
  distance: number;
  meanSpeed: number;
}

interface StartStopContextData {
  duration: number;
  startTime: number | null;
  endTime: number | null;
  status: CurrentRouteStatus;
  maxSpeed: number | null;
  handleStart: () => void;
  handleRestart: () => void;
  handlePause: () => void;
  handleStop: () => void;
}

export const StartStopContext = createContext<StartStopContextData>(
  {} as {} as StartStopContextData,
);

const StartStopProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const [status, setStatus] = useState<CurrentRouteStatus>("stopped");
  const [speed, setSpeed] = useState<number | null>(null);
  const [maxSpeed, setMaxSpeed] = useState<number | null>(null);
  const [stoppedTime, setStoppedTime] = useState(0);

  const [startLocation, setStartLocation] =
    useState<GeolocationResponse | null>(null);
  const [latestLocation, setLatestLocation] =
    useState<GeolocationResponse | null>(null);
  const [locations, setLocations] = useState<Array<GeolocationResponse>>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subscriptionRef = useRef<number | null>(null);

  const [routesHistory, setRoutesHistory] = useState<Route[]>([]);

  const handleStart = () => {
    const initial = latestLocation || startLocation;
    if (initial) {
      locations.push(initial);
    }

    setStartTime(Date.now());
    setStatus("running");

    const id = setInterval(() => {
      setDuration((v) => v + 1);
    }, 1000);
    timerIdRef.current = id;
  };

  const handleRestart = () => {
    const id = setInterval(() => {
      setDuration((v) => v + 1);
    }, 1000);
    timerIdRef.current = id;
    setStatus("running");
  };

  const handlePause = () => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
      setStatus("paused");
    }
  };

  const handleStop = () => {
    const endedTime = Date.now();

    if (timerIdRef.current) {
      setStatus("stopped");
      setEndTime(endedTime);

      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }

    handleSaveRoute(endedTime);
  };

  const handleSaveRoute = (endedTime: number) => {
    if (startTime && startTime) {
      //true
      const distance = calculateDistance(locations);
      const meanSpeed = calculateMeanSpeed(distance, duration);

      const route: Route = {
        id: startTime,
        duration,
        startTime,
        endTime: endedTime,
        maxSpeed: 0,
        locations,
        stoppedTime,
        distance,
        meanSpeed,
      };

      console.log("route", route);

      setRoutesHistory((history) => [...history, route]);
    }

    setDuration(0);
    setStartTime(null);
    setEndTime(null);
    setMaxSpeed(null);
    setStoppedTime(0);
    setLocations([]);
    setStartLocation(null);
  };

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
          setErrorMsg("A permissão para acessar a localização foi negada");
        },
      );
    }

    async function startInitialTracking() {
      subscriptionRef.current = Geolocation.watchPosition(
        (latest) => {
          console.log("latest", latest);
          setLatestLocation(latest);
        },
        (error) => {
          console.log("watch error", error);
        },
        { interval: 100, enableHighAccuracy: true, distanceFilter: 1 },
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

  const value: StartStopContextData = {
    duration,
    startTime,
    endTime,
    maxSpeed,
    status,
    handleStart,
    handleRestart,
    handlePause,
    handleStop,
  };

  return (
    <StartStopContext.Provider value={value}>
      {children}
    </StartStopContext.Provider>
  );
};

export default StartStopProvider;

function calculateDistance(locations: Array<GeolocationResponse>): number {
  let distance = 0;

  distance = locations.reduce((distSum, curr, index, list) => {
    const next: GeolocationResponse | undefined = list?.[index + 1];

    if (!next) {
      return distSum;
    }

    return (
      distSum +
      calculatePointsDistance(
        curr.coords.latitude,
        curr.coords.longitude,
        next.coords.latitude,
        next.coords.longitude,
      )
    );
  }, 0);

  return distance;
}

function calculateMeanSpeed(distance: number, durationSeconds: number): number {
  if (durationSeconds === 0) {
    return 0;
  }

  const timeInHours = durationSeconds / 60 / 60;

  return +(distance / timeInHours).toFixed(2);
}

function calculatePointsDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371; // Radius of the Earth in kilometers

  // Convert degrees to radians
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in kilometers
  return distance;
}
