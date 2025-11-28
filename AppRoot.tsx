import App from "./App";
import StartStopProvider from "./src/context/StartStopContext";

export default function AppRoot() {
  return (
    <StartStopProvider>
      <App />
    </StartStopProvider>
  );
}
