import type { RailwayLine } from "../types";

/**
 * DEMO DATA — hand-authored for the v1 draft.
 * Station coordinates are approximate town centres; line geometry is a
 * straight-line join between them, not a surveyed track alignment.
 * This file stands in for the Notion-backed sync job described in the
 * technical spec ("How an answer is made" / overnight import job).
 */

const wroclawGlowny: [number, number] = [17.0385, 51.0997];
const wroclawSwiebodzki: [number, number] = [17.018, 51.108];
const legnica: [number, number] = [16.1619, 51.207];
const chojnow: [number, number] = [15.9333, 51.2833];
const boleslawiec: [number, number] = [15.572, 51.2627];
const wegliniec: [number, number] = [15.2306, 51.2897];
const zgorzelec: [number, number] = [15.0011, 51.1495];
const swidnica: [number, number] = [16.4893, 50.8447];
const jeleniaGora: [number, number] = [15.728, 50.9044];
const luban: [number, number] = [15.2917, 51.1189];
const jawor: [number, number] = [16.1938, 51.0538];
const jaworzynaSlaska: [number, number] = [16.4536, 50.9236];
const walbrzychGlowny: [number, number] = [16.2845, 50.7845];
const zabkowiceSlaskie: [number, number] = [16.8125, 50.5895];
const klodzkoGlowne: [number, number] = [16.6503, 50.4382];
const kudowaZdroj: [number, number] = [16.2547, 50.4394];
const sredaSlaska: [number, number] = [16.6, 51.1667];
const glogow: [number, number] = [16.085, 51.6636];
const olesnica: [number, number] = [17.3823, 51.2107];
const sycow: [number, number] = [17.7167, 51.3];
const kamiennaGora: [number, number] = [16.0322, 50.7778];
const trzebnica: [number, number] = [17.0678, 51.3111];
const milicz: [number, number] = [17.2795, 51.5227];
const szklarskaPoreba: [number, number] = [15.5225, 50.8264];
const swieradowZdroj: [number, number] = [15.3417, 50.9111];

export const lines: RailwayLine[] = [
  {
    id: "274",
    number: "274",
    name: "Wrocław Główny – Zgorzelec",
    status: "active_passenger",
    electrified: true,
    lengthKm: 144.9,
    tracks: 2,
    maxSpeedKmh: 120,
    operators: ["PKP PLK"],
    passengerServices: ["PKP Intercity", "Koleje Dolnośląskie"],
    endStations: ["Wrocław Główny", "Zgorzelec"],
    stations: [
      { id: "wroclaw-glowny", name: "Wrocław Główny", coordinates: wroclawGlowny },
      { id: "legnica", name: "Legnica", coordinates: legnica },
      { id: "chojnow", name: "Chojnów", coordinates: chojnow },
      { id: "boleslawiec", name: "Bolesławiec", coordinates: boleslawiec },
      { id: "wegliniec", name: "Węgliniec", coordinates: wegliniec },
      { id: "zgorzelec", name: "Zgorzelec", coordinates: zgorzelec },
    ],
    geometry: [wroclawGlowny, legnica, chojnow, boleslawiec, wegliniec, zgorzelec],
    history: {
      timeline: [
        { year: 1844, label: "Otwarcie odcinka Wrocław – Legnica" },
        { year: 1867, label: "Przedłużenie linii do Zgorzelca" },
        { year: 1965, label: "Elektryfikacja całej linii" },
        { year: 2018, label: "Modernizacja odcinka Legnica – Węgliniec" },
      ],
      narrative:
        "Linia 274 jest jednym z najstarszych i najważniejszych ciągów kolejowych Dolnego Śląska, łączącym Wrocław z Zgorzelcem i granicą niemiecką. Powstała w połowie XIX wieku jako część pruskiej sieci kolejowej i od tego czasu pełni funkcję głównej magistrali pasażersko-towarowej regionu. Po elektryfikacji w latach 60. XX wieku stała się podstawą ruchu dalekobieżnego w kierunku zachodnim. Obecnie kursują nią pociągi PKP Intercity oraz regionalne składy Kolei Dolnośląskich, obsługujące m.in. Legnicę, Bolesławiec i Węgliniec — ważny węzeł towarowy na granicy z Niemcami.",
      photos: [],
    },
    tenders: [
      {
        id: "t-274-1",
        title: "Modernizacja peronów na odcinku Legnica – Chojnów",
        authority: "PKP Polskie Linie Kolejowe S.A.",
        estimatedValuePLN: 42_000_000,
        publicationDate: "2026-08-01",
        deadline: "2026-10-15",
        status: "open",
        url: "https://przetargi.plk-sa.pl/example-274-1",
        matchType: "confirmed",
      },
    ],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-20" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "275",
    number: "275",
    name: "Wrocław Świebodzki – Zgorzelec",
    status: "active_passenger",
    electrified: false,
    lengthKm: 154.3,
    tracks: 1,
    maxSpeedKmh: 90,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Wrocław Świebodzki", "Zgorzelec"],
    stations: [
      { id: "wroclaw-swiebodzki", name: "Wrocław Świebodzki", coordinates: wroclawSwiebodzki },
      { id: "swidnica", name: "Świdnica", coordinates: swidnica },
      { id: "jelenia-gora", name: "Jelenia Góra", coordinates: jeleniaGora },
      { id: "luban", name: "Lubań Śląski", coordinates: luban },
      { id: "zgorzelec-275", name: "Zgorzelec", coordinates: zgorzelec },
    ],
    geometry: [wroclawSwiebodzki, swidnica, jeleniaGora, luban, zgorzelec],
    history: {
      timeline: [
        { year: 1866, label: "Otwarcie odcinka przez Kotlinę Jeleniogórską" },
        { year: 1945, label: "Zmiana zarządcy po II wojnie światowej" },
        { year: 2023, label: "Rozpoczęcie prac administratora nad dedykowanym opisem linii" },
      ],
      narrative:
        "Linia 275 biegnie malowniczą trasą przez Kotlinę Jeleniogórską, łącząc Wrocław ze Zgorzelcem przez Świdnicę i Jelenią Górę. Ze względu na turystyczne znaczenie regionu sudeckiego, dane tej linii są prowadzone ręcznie przez administratora serwisu w dedykowanej strukturze Notion, niezależnie od automatycznego procesu synchronizacji stosowanego dla pozostałych linii — zgodnie z wymaganiem specyfikacji v1.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "Notion — struktura dedykowana (administrator)", lastUpdated: "2026-09-22" },
      { section: "history", label: "Notion — struktura dedykowana (administrator)", lastUpdated: "2026-09-22" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
    manuallyCurated: true,
  },
  {
    id: "137",
    number: "137",
    name: "Legnica – Kłodzko Główne",
    status: "active_passenger",
    electrified: true,
    lengthKm: 111.2,
    tracks: 2,
    maxSpeedKmh: 100,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie", "PolRegio"],
    endStations: ["Legnica", "Kłodzko Główne"],
    stations: [
      { id: "legnica-137", name: "Legnica", coordinates: legnica },
      { id: "jawor", name: "Jawor", coordinates: jawor },
      { id: "swidnica-137", name: "Świdnica", coordinates: swidnica },
      { id: "jaworzyna-slaska", name: "Jaworzyna Śląska", coordinates: jaworzynaSlaska },
      { id: "walbrzych-glowny", name: "Wałbrzych Główny", coordinates: walbrzychGlowny },
      { id: "zabkowice-slaskie", name: "Ząbkowice Śląskie", coordinates: zabkowiceSlaskie },
      { id: "klodzko-glowne", name: "Kłodzko Główne", coordinates: klodzkoGlowne },
    ],
    geometry: [legnica, jawor, swidnica, jaworzynaSlaska, walbrzychGlowny, zabkowiceSlaskie, klodzkoGlowne],
    history: {
      timeline: [
        { year: 1856, label: "Otwarcie pierwszego odcinka" },
        { year: 1970, label: "Elektryfikacja odcinka Legnica – Świdnica" },
        { year: 1998, label: "Elektryfikacja całej linii" },
      ],
      narrative:
        "Linia 137 spina Legnicę z Kotliną Kłodzką, obsługując gęsto zaludniony pas Przedgórza Sudeckiego wraz z aglomeracją wałbrzyską. Historycznie kluczowa dla transportu węgla z zagłębia wałbrzyskiego, dziś pełni głównie funkcję pasażerską w ruchu regionalnym.",
      photos: [],
    },
    tenders: [
      {
        id: "t-137-1",
        title: "Przebudowa stacji Wałbrzych Główny — etap II",
        authority: "PKP Polskie Linie Kolejowe S.A.",
        estimatedValuePLN: 128_000_000,
        publicationDate: "2026-07-12",
        deadline: "2026-11-30",
        status: "open",
        url: "https://przetargi.plk-sa.pl/example-137-1",
        matchType: "auto-matched",
      },
    ],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-18" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "273",
    number: "273",
    name: "Wrocław Główny – Głogów",
    status: "active_passenger",
    electrified: true,
    lengthKm: 96.4,
    tracks: 2,
    maxSpeedKmh: 140,
    operators: ["PKP PLK"],
    passengerServices: ["PKP Intercity", "Koleje Dolnośląskie"],
    endStations: ["Wrocław Główny", "Głogów"],
    stations: [
      { id: "wroclaw-glowny-273", name: "Wrocław Główny", coordinates: wroclawGlowny },
      { id: "sreda-slaska", name: "Środa Śląska", coordinates: sredaSlaska },
      { id: "glogow", name: "Głogów", coordinates: glogow },
    ],
    geometry: [wroclawGlowny, sredaSlaska, glogow],
    history: {
      timeline: [
        { year: 1874, label: "Otwarcie linii wzdłuż Odry" },
        { year: 1988, label: "Elektryfikacja" },
      ],
      narrative:
        "Odcinek dolnośląski magistrali odrzańskiej łączącej Wrocław ze Szczecinem. Linia obsługuje ruch dalekobieżny w kierunku północno-zachodnim oraz regionalny do Głogowa i dalej wzdłuż doliny Odry.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-15" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "285",
    number: "285",
    name: "Kłodzko Główne – Kudowa-Zdrój",
    status: "active_passenger",
    electrified: false,
    lengthKm: 32.1,
    tracks: 1,
    maxSpeedKmh: 60,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Kłodzko Główne", "Kudowa-Zdrój"],
    stations: [
      { id: "klodzko-glowne-285", name: "Kłodzko Główne", coordinates: klodzkoGlowne },
      { id: "kudowa-zdroj", name: "Kudowa-Zdrój", coordinates: kudowaZdroj },
    ],
    geometry: [klodzkoGlowne, kudowaZdroj],
    history: {
      timeline: [
        { year: 1902, label: "Otwarcie linii do Kudowy-Zdroju" },
        { year: 2021, label: "Rewitalizacja infrastruktury torowej" },
      ],
      narrative:
        "Turystyczna linia jednotorowa prowadząca z Kłodzka do uzdrowiska Kudowa-Zdrój, obsługująca ruch sezonowy i codzienne dojazdy mieszkańców Kotliny Kłodzkiej.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-10" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "292",
    number: "292",
    name: "Wałbrzych Główny – Kamienna Góra",
    status: "closed",
    electrified: false,
    lengthKm: 21.7,
    tracks: 1,
    maxSpeedKmh: 0,
    operators: ["PKP PLK"],
    passengerServices: [],
    endStations: ["Wałbrzych Główny", "Kamienna Góra"],
    stations: [
      { id: "walbrzych-glowny-292", name: "Wałbrzych Główny", coordinates: walbrzychGlowny },
      { id: "kamienna-gora", name: "Kamienna Góra", coordinates: kamiennaGora },
    ],
    geometry: [walbrzychGlowny, kamiennaGora],
    history: {
      timeline: [
        { year: 1895, label: "Otwarcie linii" },
        { year: 2000, label: "Zawieszenie ruchu pasażerskiego" },
        { year: 2009, label: "Formalne zamknięcie linii" },
      ],
      narrative:
        "Dawne połączenie Wałbrzycha z Kamienną Górą zamknięte na początku XXI wieku wraz z ograniczeniem ruchu regionalnego w Sudetach. Torowisko w większości zachowane, linia figuruje jako nieczynna z zachowaną infrastrukturą.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-08-30" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "316",
    number: "316",
    name: "Wrocław Główny – Syców",
    status: "active_passenger",
    electrified: true,
    lengthKm: 68.9,
    tracks: 2,
    maxSpeedKmh: 120,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie", "PolRegio"],
    endStations: ["Wrocław Główny", "Syców"],
    stations: [
      { id: "wroclaw-glowny-316", name: "Wrocław Główny", coordinates: wroclawGlowny },
      { id: "olesnica", name: "Oleśnica", coordinates: olesnica },
      { id: "sycow", name: "Syców", coordinates: sycow },
    ],
    geometry: [wroclawGlowny, olesnica, sycow],
    history: {
      timeline: [
        { year: 1868, label: "Otwarcie linii w kierunku Wielkopolski" },
        { year: 1975, label: "Elektryfikacja odcinka do Oleśnicy" },
      ],
      narrative:
        "Linia biegnąca z Wrocławia na wschód w kierunku Wielkopolski, w granicach województwa obsługująca Oleśnicę i Syców. Dalszy przebieg poza Dolnym Śląskiem nie jest ujęty w tej aplikacji.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-12" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "293",
    number: "293",
    name: "Legnica – Głogów",
    status: "freight_only",
    electrified: true,
    lengthKm: 51.3,
    tracks: 1,
    maxSpeedKmh: 80,
    operators: ["PKP PLK"],
    passengerServices: [],
    endStations: ["Legnica", "Głogów"],
    stations: [
      { id: "legnica-293", name: "Legnica", coordinates: legnica },
      { id: "glogow-293", name: "Głogów", coordinates: glogow },
    ],
    geometry: [legnica, glogow],
    history: {
      timeline: [
        { year: 1873, label: "Otwarcie linii" },
        { year: 1996, label: "Zawieszenie regularnego ruchu pasażerskiego" },
      ],
      narrative:
        "Dziś wykorzystywana niemal wyłącznie do przewozów towarowych związanych z przemysłem miedziowym Zagłębia Legnicko-Głogowskiego.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-08-28" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "311",
    number: "311",
    name: "Trzebnica – Milicz",
    status: "planned",
    electrified: false,
    lengthKm: 38.6,
    tracks: 1,
    maxSpeedKmh: 0,
    operators: ["PKP PLK"],
    passengerServices: [],
    endStations: ["Trzebnica", "Milicz"],
    stations: [
      { id: "trzebnica", name: "Trzebnica", coordinates: trzebnica },
      { id: "milicz", name: "Milicz", coordinates: milicz },
    ],
    geometry: [trzebnica, milicz],
    history: {
      timeline: [
        { year: 1901, label: "Otwarcie linii" },
        { year: 1991, label: "Zamknięcie dla ruchu pasażerskiego" },
        { year: 2025, label: "Ogłoszenie planu reaktywacji przez samorząd regionalny" },
      ],
      narrative:
        "Nieczynna od 1991 roku linia jest przedmiotem planu reaktywacji zgłoszonego przez samorząd województwa jako część programu przywracania kolei regionalnych. Prace studialne trwają, brak jeszcze harmonogramu robót.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "Urząd Marszałkowski Województwa Dolnośląskiego", lastUpdated: "2026-09-05" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-08-20" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "321",
    number: "321",
    name: "Jelenia Góra – Świeradów-Zdrój",
    status: "closed",
    electrified: false,
    lengthKm: 24.8,
    tracks: 1,
    maxSpeedKmh: 0,
    operators: ["PKP PLK"],
    passengerServices: [],
    endStations: ["Jelenia Góra", "Świeradów-Zdrój"],
    stations: [
      { id: "jelenia-gora-321", name: "Jelenia Góra", coordinates: jeleniaGora },
      { id: "szklarska-poreba", name: "Szklarska Poręba", coordinates: szklarskaPoreba },
      { id: "swieradow-zdroj", name: "Świeradów-Zdrój", coordinates: swieradowZdroj },
    ],
    geometry: [jeleniaGora, szklarskaPoreba, swieradowZdroj],
    history: {
      timeline: [
        { year: 1909, label: "Otwarcie linii górskiej" },
        { year: 1985, label: "Zawieszenie ruchu pasażerskiego" },
      ],
      narrative:
        "Górska linia widokowa w Karkonoszach i Górach Izerskich, nieczynna od połowy lat 80. XX wieku. Torowisko częściowo zachowane, pojawiają się inicjatywy turystycznej reaktywacji.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-07-15" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
];

export function findLineByNumber(number: string): RailwayLine | undefined {
  return lines.find((l) => l.number === number);
}
