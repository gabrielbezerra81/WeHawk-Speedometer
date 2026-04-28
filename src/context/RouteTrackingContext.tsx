import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { createContext } from "use-context-selector";

import AsyncStorage from "@react-native-async-storage/async-storage";

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
  setStartLocation: React.Dispatch<
    React.SetStateAction<GeolocationResponse | null>
  >;
  setLatestLocation: React.Dispatch<
    React.SetStateAction<GeolocationResponse | null>
  >;
  setLocations: React.Dispatch<React.SetStateAction<GeolocationResponse[]>>;
  latestLocation: GeolocationResponse | null;
  setMaxSpeed: React.Dispatch<React.SetStateAction<number | null>>;
  locations: GeolocationResponse[];
}

export const RouteTrackingContext = createContext<StartStopContextData>(
  {} as {} as StartStopContextData,
);

const RouteTrackingProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const [status, setStatus] = useState<CurrentRouteStatus>("stopped");
  const [maxSpeed, setMaxSpeed] = useState<number | null>(null);
  const [stoppedTime, setStoppedTime] = useState(0);

  const [startLocation, setStartLocation] =
    useState<GeolocationResponse | null>(null);
  const [latestLocation, setLatestLocation] =
    useState<GeolocationResponse | null>(null);
  const [locations, setLocations] = useState<Array<GeolocationResponse>>([]);

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
      const meanSpeed = calculateAvgSpeed(distance, duration);

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
    setLatestLocation(null);
  };

  // load/save routes history
  useEffect(() => {
    async function loadRoutesHistory() {
      const json = await AsyncStorage.getItem(routesHistoryKey);

      if (json) {
        setRoutesHistory(JSON.parse(json));
      }
    }

    loadRoutesHistory();

    return () => {
      AsyncStorage.setItem(routesHistoryKey, JSON.stringify(routesHistory));
    };
  }, []);

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
    setLocations,
    setStartLocation,
    setLatestLocation,
    latestLocation,
    setMaxSpeed,
    locations,
  };

  return (
    <RouteTrackingContext.Provider value={value}>
      {children}
    </RouteTrackingContext.Provider>
  );
};

export default RouteTrackingProvider;

const routesHistoryKey = "@wehawk-routesHistory";

export function calculateDistance(
  locations: Array<GeolocationResponse>,
): number {
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

export function calculateAvgSpeed(
  distance: number,
  durationSeconds: number,
): number {
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

export function formatSpeed({
  speed,
  includeUnit,
}: {
  speed: number | null;
  includeUnit: boolean;
}) {
  if (speed === null) {
    return "--";
  }

  return (
    (speed * 3.6).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + (includeUnit ? " km/h" : "")
  );
}

export function formatTime(seconds: number) {
  const hours = Math.trunc(seconds / 3600).toLocaleString(undefined, {
    minimumIntegerDigits: 2,
  });
  const minutes = Math.trunc((seconds % 3600) / 60).toLocaleString(undefined, {
    minimumIntegerDigits: 2,
  });

  const remainingSeconds = ((seconds % 3600) % 60).toLocaleString(undefined, {
    minimumIntegerDigits: 2,
  });

  return `${hours}:${minutes}:${remainingSeconds}`;
}

export function formatDistance(distance: number) {
  return (
    distance.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " km"
  );
}
