import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useContextSelector } from "use-context-selector";
import {
  calculateAvgSpeed,
  calculateDistance,
  formatDistance,
  formatSpeed,
  formatTime,
  RouteTrackingContext,
} from "./src/context/RouteTrackingContext";

import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  useFonts,
} from "@expo-google-fonts/roboto";

import { useKeepAwake } from "expo-keep-awake";

import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";

export default function App() {
  const duration = useContextSelector(RouteTrackingContext, (s) => s.duration);
  const startTime = useContextSelector(
    RouteTrackingContext,
    (s) => s.startTime,
  );
  const endTime = useContextSelector(RouteTrackingContext, (s) => s.endTime);
  const status = useContextSelector(RouteTrackingContext, (s) => s.status);
  const maxSpeed = useContextSelector(RouteTrackingContext, (s) => s.maxSpeed);
  const latestLocation = useContextSelector(
    RouteTrackingContext,
    (s) => s.latestLocation,
  );

  const handleStart = useContextSelector(
    RouteTrackingContext,
    (s) => s.handleStart,
  );

  const handleRestart = useContextSelector(
    RouteTrackingContext,
    (s) => s.handleRestart,
  );

  const handlePause = useContextSelector(
    RouteTrackingContext,
    (s) => s.handlePause,
  );

  const handleStop = useContextSelector(
    RouteTrackingContext,
    (s) => s.handleStop,
  );

  const locations = useContextSelector(
    RouteTrackingContext,
    (s) => s.locations,
  );

  const timeDiff = startTime && endTime ? endTime - startTime : null;

  const buttonConfig = (() => {
    let onPress = handleStart;
    let text = "INICIAR";

    if (status === "running") {
      onPress = handleStop;
      text = "ENCERRAR";
    } //
    else if (status === "paused") {
      onPress = handleRestart;
      text = "RETOMAR";
    }

    return { onPress, text };
  })();

  const partialDistance = useMemo(
    () => calculateDistance(locations),
    [locations],
  );

  const averageSpeed = useMemo(() => {
    const speed = calculateAvgSpeed(partialDistance, duration);
    return formatSpeed({ speed, includeUnit: true });
  }, [partialDistance, duration]);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  useKeepAwake();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {status === "running" && (
        <>
          <View style={styles.speedContainer}>
            <MaterialDesignIcons name="bike" color="#fff" size={18} />
            <Text style={[styles.texts, styles.speedNumbers]}>
              {formatSpeed({
                speed: latestLocation?.coords?.speed || null,
                includeUnit: false,
              })}
            </Text>
            <Text style={[styles.texts, styles.speedUnit]}> km/h</Text>
          </View>
          <Text style={styles.texts}>
            Distância:{"  "}
            {formatDistance(partialDistance)}
          </Text>
          <Text style={styles.texts}>
            Tempo:{"  "}
            {formatTime(duration)}
          </Text>
          <Text style={styles.texts}>
            V. Média:{"  "}
            {averageSpeed}
          </Text>
          <Text style={styles.texts}>
            V. Máx:{"  "}
            {formatSpeed({ speed: maxSpeed, includeUnit: true })}
          </Text>
        </>
      )}

      <TouchableOpacity
        onPress={buttonConfig.onPress}
        style={styles.startStopButton}
      >
        <Text style={styles.startStopText}>{buttonConfig.text}</Text>
      </TouchableOpacity>
      {/* {isRunning && (
        <TouchableOpacity
          onPress={handlePause}
          style={styles.pauseButton}
        >
          <Text
            style={styles.pauseText}
          >
            Pausar
          </Text>
        </TouchableOpacity>
      )} */}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  startStopButton: {
    backgroundColor: "blue",
    borderRadius: 32,
    padding: 5,
    width: 124,
    marginTop: 6,
  },
  startStopText: {
    textAlign: "center",
    color: "#fff",
    fontFamily: "Roboto_500Medium",
  },
  texts: {
    color: "#fff",
    // fontWeight: "500",
    textAlign: "center",
    marginTop: 3,
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
  },
  pauseButton: {
    backgroundColor: "blue",
    borderRadius: 32,
    padding: 8,
    width: 72,
    marginTop: 8,
  },
  pauseText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "500",
  },
  speedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  speedNumbers: {
    fontSize: 32,
    lineHeight: 32,
    marginTop: 0,
    marginLeft: 4,
    fontFamily: "Roboto_500Medium",
  },
  speedUnit: {
    marginTop: "auto",
  },
});

// Wearos Mobilidade Prototipo
// Protótipo Figma: App de Mobilidade Wear OS para WeHawk
// 🔹 Tela 1 — Painel Principal
// Tamanho do Frame: 390 x 390 px (formato circular)
// Elementos:
// Text_VelocidadeAtual → Texto grande e centralizado (ex: "28 km/h")
// Text_DistanciaAtual → Texto menor, abaixo (ex: "Distância: 1,2 km")
// Text_TempoAtual → Texto abaixo da distância (ex: "Tempo: 00:07:35")
// Text_DistanciaTotal → Canto inferior esquerdo (ex: "Total: 40,2 km")
// Text_VelocidadeMax → Canto inferior direito (ex: "V. Máx: 36 km/h")
// Btn_EncerrarSessao → Botão laranja grande com texto branco "Encerrar Sessão"
