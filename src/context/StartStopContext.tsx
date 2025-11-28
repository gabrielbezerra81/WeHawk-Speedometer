import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { createContext } from "use-context-selector";

import * as Location from "expo-location";

type CurrentRouteStatus = "running" | "paused" | "stopped";

interface Route {
  id: number;
  duration: number;
  startTime: number;
  endTime: number;
  maxSpeed: number;
  locations: Array<Location.LocationObject>;
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
    useState<Location.LocationObject | null>(null);
  const [latestLocation, setLatestLocation] =
    useState<Location.LocationObject | null>(null);
  const [locations, setLocations] = useState<Array<Location.LocationObject>>(
    [],
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

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

      console.log(route);

      setRoutesHistory((history) => [...history, route]);
    }

    setDuration(0);
    setStartTime(null);
    setEndTime(null);
    setMaxSpeed(null);
    setStoppedTime(0);
    setLocations([]);
  };

  // get initial and start tracking
  useEffect(() => {
    async function getInitialLocation() {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        console.log("status", status);
        if (status !== "granted") {
          setErrorMsg("A permissão para acessar a localização foi negada");
          return;
        }

        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        console.log("initial", initial);

        setStartLocation(initial);
      } catch (error) {
        console.log("location error", JSON.stringify(error));
      }
    }

    async function startInitialTracking() {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 100,
        },
        (latest) => {
          console.log("latest", latest.coords);
          setLatestLocation(latest);
        },
      );

      subscriptionRef.current = subscription;
    }

    setTimeout(() => {
      getInitialLocation();
    }, 500);
    setTimeout(() => {
      startInitialTracking();
    }, 1000);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  // add new locations when running
  useEffect(() => {
    if (status === "running" && latestLocation) {
      locations.push(latestLocation);
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

  console.log("errorMsg", errorMsg);

  return (
    <StartStopContext.Provider value={value}>
      {children}
    </StartStopContext.Provider>
  );
};

export default StartStopProvider;

function calculateDistance(locations: Array<Location.LocationObject>): number {
  let distance = 0;

  distance = locations.reduce((distSum, curr, index, list) => {
    const next: Location.LocationObject | undefined = list?.[index + 1];

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

function calculateMeanSpeed(distance: number, duration: number): number {
  if (duration === 0) {
    return 0;
  }

  return +(distance / duration).toFixed(2);
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
