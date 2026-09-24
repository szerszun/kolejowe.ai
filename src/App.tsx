import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/line/:number" element={<HomePage />} />
      <Route path="/station/:stationId" element={<HomePage />} />
    </Routes>
  );
}

export default App;
