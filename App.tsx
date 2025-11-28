import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useContextSelector } from "use-context-selector";
import { StartStopContext } from "./src/context/StartStopContext";

import * as Location from "expo-location";

export default function App() {
  const [speed, setSpeed] = useState<number | null>(null);

  const duration = useContextSelector(StartStopContext, (s) => s.duration);
  const startTime = useContextSelector(StartStopContext, (s) => s.startTime);
  const endTime = useContextSelector(StartStopContext, (s) => s.endTime);
  const status = useContextSelector(StartStopContext, (s) => s.status);
  const maxSpeed = useContextSelector(StartStopContext, (s) => s.maxSpeed);

  const handleStart = useContextSelector(
    StartStopContext,
    (s) => s.handleStart,
  );

  const handleRestart = useContextSelector(
    StartStopContext,
    (s) => s.handleRestart,
  );

  const handlePause = useContextSelector(
    StartStopContext,
    (s) => s.handlePause,
  );

  const handleStop = useContextSelector(StartStopContext, (s) => s.handleStop);

  const timeDiff = startTime && endTime ? endTime - startTime : null;

  const buttonConfig = (() => {
    let onPress = handleStart;
    let text = "INICIAR";

    if (status === "running") {
      onPress = handleStop;
      text = "PARAR";
    } //
    else if (status === "paused") {
      onPress = handleRestart;
      text = "RETOMAR";
    }

    return { onPress, text };
  })();

  return (
    <View style={styles.container}>
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
      {!!duration && (
        <Text
          style={[
            styles.texts,
            {
              marginTop: 8,
            },
          ]}
        >
          Tempo decorrido: {duration} segundos
        </Text>
      )}
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
    padding: 8,
    width: 100,
  },
  startStopText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "500",
  },
  texts: {
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
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
