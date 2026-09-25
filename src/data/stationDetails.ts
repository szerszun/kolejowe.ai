import type { StationDetails } from "../types";

// Hand-authored sample data for a handful of flagship stations, standing in
// for the real Notion-backed station sync described in the spec. Photo
// credits: Wikimedia Commons, CC BY-SA / CC BY (see each entry).
export const stationDetails: Record<string, StationDetails> = {
  "osm-155479759": {
    stationId: "osm-155479759",
    category: "Dworzec węzłowy",
    address: "ul. Piłsudskiego 105, 50-086 Wrocław",
    yearBuilt: 1857,
    platformCount: 6,
    accessibility: "Winda na peron 6; pozostałe perony dostępne częściowo, trwa sukcesywna modernizacja z montażem wind.",
    amenities: ["Poczekalnia", "Kasy biletowe", "Zabytkowa hala peronowa", "Sklepy i gastronomia", "Przechowalnia bagażu"],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Wroc%C5%82aw_Dworzec_G%C5%82%C3%B3wny.jpg/500px-Wroc%C5%82aw_Dworzec_G%C5%82%C3%B3wny.jpg",
      credit: "Jednozgloskowiec, Wikimedia Commons, CC BY-SA 3.0",
    },
    timetable: [
      { id: "wroc-1", time: "06:12", lineId: "271", destination: "Poznań Główny", operator: "PKP Intercity", platform: "4", daysOfOperation: "daily" },
      { id: "wroc-2", time: "06:45", lineId: "132", destination: "Bytom", operator: "PKP Intercity", platform: "2", daysOfOperation: "weekdays" },
      { id: "wroc-3", time: "07:30", lineId: "285", destination: "Świdnica Kraszowice", operator: "Koleje Dolnośląskie", platform: "6", daysOfOperation: "daily" },
      { id: "wroc-4", time: "09:15", lineId: "311", destination: "Jelenia Góra", operator: "Koleje Dolnośląskie", platform: "3", daysOfOperation: "daily" },
      { id: "wroc-5", time: "11:50", lineId: "273", destination: "Szczecin Główny", operator: "PKP Intercity", platform: "1", daysOfOperation: "daily" },
      { id: "wroc-6", time: "14:20", lineId: "143", destination: "Namysłów", operator: "Koleje Dolnośląskie", platform: "5", daysOfOperation: "weekdays" },
      { id: "wroc-7", time: "16:40", lineId: "271", destination: "Poznań Główny", operator: "PKP Intercity", platform: "4", daysOfOperation: "daily" },
      { id: "wroc-8", time: "19:05", lineId: "285", destination: "Świdnica Kraszowice", operator: "Koleje Dolnośląskie", platform: "6", daysOfOperation: "weekend" },
      { id: "wroc-9", time: "21:35", lineId: "132", destination: "Bytom", operator: "PKP Intercity", platform: "2", daysOfOperation: "daily" },
    ],
    arrivals: [
      { id: "wroc-a1", time: "06:55", lineId: "271", origin: "Poznań Główny", operator: "PKP Intercity", platform: "4", daysOfOperation: "daily" },
      { id: "wroc-a2", time: "08:05", lineId: "285", origin: "Świdnica Kraszowice", operator: "Koleje Dolnośląskie", platform: "6", daysOfOperation: "daily" },
      { id: "wroc-a3", time: "09:50", lineId: "132", origin: "Bytom", operator: "PKP Intercity", platform: "2", daysOfOperation: "weekdays" },
      { id: "wroc-a4", time: "12:35", lineId: "273", origin: "Szczecin Główny", operator: "PKP Intercity", platform: "1", daysOfOperation: "daily" },
      { id: "wroc-a5", time: "14:55", lineId: "311", origin: "Jelenia Góra", operator: "Koleje Dolnośląskie", platform: "3", daysOfOperation: "daily" },
      { id: "wroc-a6", time: "17:25", lineId: "271", origin: "Poznań Główny", operator: "PKP Intercity", platform: "4", daysOfOperation: "daily" },
      { id: "wroc-a7", time: "19:50", lineId: "143", origin: "Namysłów", operator: "Koleje Dolnośląskie", platform: "5", daysOfOperation: "weekdays" },
      { id: "wroc-a8", time: "22:15", lineId: "285", origin: "Świdnica Kraszowice", operator: "Koleje Dolnośląskie", platform: "6", daysOfOperation: "weekend" },
    ],
    sources: [
      { section: "overview", label: "Wikipedia — Wrocław Główny", url: "https://pl.wikipedia.org/wiki/Wroc%C5%82aw_G%C5%82%C3%B3wny", lastUpdated: "2026-09-25" },
    ],
  },
  "osm-2627870779": {
    stationId: "osm-2627870779",
    category: "Dworzec wojewódzki",
    address: "ul. Dworcowa, 59-220 Legnica",
    yearBuilt: 1929,
    platformCount: 6,
    accessibility: "Windy montowane na 4 peronach w ramach modernizacji rozpoczętej w 2019 r.; do czasu jej zakończenia dostęp częściowo tylko schodami.",
    amenities: ["Poczekalnia", "Kasy biletowe", "Zabytkowa hala peronowa"],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Legnica%2C_budynek_dworca_%281%29.jpg/500px-Legnica%2C_budynek_dworca_%281%29.jpg",
      credit: "Adam Biegaj, Wikimedia Commons, CC BY-SA 4.0",
    },
    timetable: [
      { id: "legn-1", time: "05:50", lineId: "275", destination: "Wrocław Muchobór", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "daily" },
      { id: "legn-2", time: "07:20", lineId: "137", destination: "Katowice", operator: "PKP Intercity", platform: "1", daysOfOperation: "daily" },
      { id: "legn-3", time: "08:40", lineId: "284", destination: "Lwówek Śląski", operator: "Koleje Dolnośląskie", platform: "4", daysOfOperation: "weekdays" },
      { id: "legn-4", time: "12:10", lineId: "275", destination: "Gubinek", operator: "Koleje Dolnośląskie", platform: "3", daysOfOperation: "daily" },
      { id: "legn-5", time: "15:30", lineId: "137", destination: "Katowice", operator: "PKP Intercity", platform: "1", daysOfOperation: "weekend" },
      { id: "legn-6", time: "18:05", lineId: "284", destination: "Lwówek Śląski", operator: "Koleje Dolnośląskie", platform: "4", daysOfOperation: "daily" },
      { id: "legn-7", time: "20:45", lineId: "275", destination: "Wrocław Muchobór", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "daily" },
    ],
    arrivals: [
      { id: "legn-a1", time: "07:05", lineId: "275", origin: "Wrocław Muchobór", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "daily" },
      { id: "legn-a2", time: "09:35", lineId: "137", origin: "Katowice", operator: "PKP Intercity", platform: "1", daysOfOperation: "daily" },
      { id: "legn-a3", time: "11:00", lineId: "284", origin: "Lwówek Śląski", operator: "Koleje Dolnośląskie", platform: "4", daysOfOperation: "weekdays" },
      { id: "legn-a4", time: "13:50", lineId: "275", origin: "Gubinek", operator: "Koleje Dolnośląskie", platform: "3", daysOfOperation: "daily" },
      { id: "legn-a5", time: "17:10", lineId: "137", origin: "Katowice", operator: "PKP Intercity", platform: "1", daysOfOperation: "weekend" },
      { id: "legn-a6", time: "19:40", lineId: "284", origin: "Lwówek Śląski", operator: "Koleje Dolnośląskie", platform: "4", daysOfOperation: "daily" },
    ],
    sources: [
      { section: "overview", label: "Wikipedia — Legnica (stacja kolejowa)", url: "https://pl.wikipedia.org/wiki/Legnica_(stacja_kolejowa)", lastUpdated: "2026-09-25" },
    ],
  },
  "osm-1642733781": {
    stationId: "osm-1642733781",
    category: "Dworzec regionalny",
    address: "ul. Dworcowa 1, Jelenia Góra",
    yearBuilt: 1866,
    platformCount: 4,
    accessibility: "Brak zweryfikowanych informacji o windach — wymaga potwierdzenia u przewoźnika przed podróżą.",
    amenities: ["Poczekalnia", "Kasa biletowa"],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Jelenia_G%C3%B3ra_%28DSCF2926%29.jpg/500px-Jelenia_G%C3%B3ra_%28DSCF2926%29.jpg",
      credit: "Janusz Jurzyk, Wikimedia Commons, CC BY-SA 2.5",
    },
    timetable: [
      { id: "jg-1", time: "06:05", lineId: "274", destination: "Zgorzelec", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "daily" },
      { id: "jg-2", time: "07:40", lineId: "274", destination: "Wrocław Świebodzki", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "daily" },
      { id: "jg-3", time: "10:15", lineId: "311", destination: "Granica Państwa (Jakuszyce)", operator: "Koleje Dolnośląskie", platform: "3", daysOfOperation: "weekend" },
      { id: "jg-4", time: "13:25", lineId: "283", destination: "Żagań", operator: "Koleje Dolnośląskie", platform: "4", daysOfOperation: "daily" },
      { id: "jg-5", time: "17:00", lineId: "274", destination: "Zgorzelec", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "daily" },
      { id: "jg-6", time: "20:10", lineId: "274", destination: "Wrocław Świebodzki", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "weekdays" },
    ],
    arrivals: [
      { id: "jg-a1", time: "07:15", lineId: "274", origin: "Wrocław Świebodzki", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "daily" },
      { id: "jg-a2", time: "08:50", lineId: "274", origin: "Zgorzelec", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "daily" },
      { id: "jg-a3", time: "11:40", lineId: "311", origin: "Granica Państwa (Jakuszyce)", operator: "Koleje Dolnośląskie", platform: "3", daysOfOperation: "weekend" },
      { id: "jg-a4", time: "14:45", lineId: "283", origin: "Żagań", operator: "Koleje Dolnośląskie", platform: "4", daysOfOperation: "daily" },
      { id: "jg-a5", time: "18:10", lineId: "274", origin: "Wrocław Świebodzki", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "daily" },
      { id: "jg-a6", time: "21:20", lineId: "274", origin: "Zgorzelec", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "weekdays" },
    ],
    sources: [
      { section: "overview", label: "Wikipedia — Jelenia Góra (stacja kolejowa)", url: "https://pl.wikipedia.org/wiki/Jelenia_G%C3%B3ra_(stacja_kolejowa)", lastUpdated: "2026-09-25" },
    ],
  },
  "osm-418127386": {
    stationId: "osm-418127386",
    category: "Dworzec wojewódzki",
    address: "ul. Dworcowa, Wałbrzych",
    yearBuilt: 1867,
    platformCount: 3,
    accessibility: "Brak windy — dostęp do peronów wyłącznie schodami.",
    amenities: ["Poczekalnia", "Kasa biletowa"],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Muzealny_Poci%C4%85g_Specjalny_Wa%C5%82brzych_G%C5%82%C3%B3wny.jpg/500px-Muzealny_Poci%C4%85g_Specjalny_Wa%C5%82brzych_G%C5%82%C3%B3wny.jpg",
      credit: "Mateusz Małkowski, Wikimedia Commons, CC BY 4.0",
    },
    timetable: [
      { id: "wal-1", time: "06:30", lineId: "274", destination: "Zgorzelec", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "daily" },
      { id: "wal-2", time: "08:10", lineId: "276", destination: "Wrocław Główny", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "daily" },
      { id: "wal-3", time: "11:45", lineId: "274", destination: "Wrocław Świebodzki", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "daily" },
      { id: "wal-4", time: "15:20", lineId: "276", destination: "Międzylesie", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "weekdays" },
      { id: "wal-5", time: "18:50", lineId: "274", destination: "Zgorzelec", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "weekend" },
    ],
    arrivals: [
      { id: "wal-a1", time: "07:35", lineId: "274", origin: "Zgorzelec", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "daily" },
      { id: "wal-a2", time: "09:20", lineId: "276", origin: "Międzylesie", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "weekdays" },
      { id: "wal-a3", time: "13:00", lineId: "274", origin: "Wrocław Świebodzki", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "daily" },
      { id: "wal-a4", time: "16:35", lineId: "276", origin: "Wrocław Główny", operator: "Koleje Dolnośląskie", platform: "2", daysOfOperation: "daily" },
      { id: "wal-a5", time: "20:05", lineId: "274", origin: "Zgorzelec", operator: "Koleje Dolnośląskie", platform: "1", daysOfOperation: "weekend" },
    ],
    sources: [
      { section: "overview", label: "Wikipedia — Wałbrzych Główny", url: "https://pl.wikipedia.org/wiki/Wa%C5%82brzych_G%C5%82%C3%B3wny", lastUpdated: "2026-09-25" },
    ],
  },
};
