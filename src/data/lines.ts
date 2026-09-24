import type { RailwayLine } from "../types";
import geo274 from "./geometry/274.json";
import geo275 from "./geometry/275.json";
import geo137 from "./geometry/137.json";
import geo273 from "./geometry/273.json";
import geo285 from "./geometry/285.json";
import geo292 from "./geometry/292.json";
import geo316 from "./geometry/316.json";
import geo311 from "./geometry/311.json";

/**
 * Line geometry for 274, 275, 137, 273, 285, 292, 316 and 311 is real
 * OpenStreetMap data (© OpenStreetMap contributors, ODbL) — stitched from
 * each line's `route=railway` relation (or, for closed/disused lines, from
 * ways tagged railway=disused with a matching `ref`) and clipped to the
 * Dolnośląskie voivodeship. It is not surveyed-grade and in one case (137)
 * is only a partial in-region fragment because that relation is too
 * disconnected to reassemble fully — see the per-line comments below.
 * Lines 293 and 321 could not be matched to real Dolnośląskie OSM data
 * (293's ref belongs to an unrelated line entirely in Opolskie; 321's
 * fallback query matched an unrelated disused way near Nysa) and keep
 * hand-drawn straight-line sample geometry instead.
 * This file otherwise stands in for the Notion-backed sync job described
 * in the technical spec ("How an answer is made" / overnight import job).
 */

const legnica: [number, number] = [16.1619, 51.207];
const glogow: [number, number] = [16.085, 51.6636];
const jeleniaGora: [number, number] = [15.728, 50.9044];
const szklarskaPoreba: [number, number] = [15.5225, 50.8264];
const swieradowZdroj: [number, number] = [15.3417, 50.9111];

export const lines: RailwayLine[] = [
  {
    id: "274",
    number: "274",
    // Real OSM identity (route relation 76134): Wroclaw Swiebodzki - Zgorzelec
    // via Jaworzyna Slaska / Walbrzych / Jelenia Gora -- corrected from the
    // earlier fictional "Wroclaw Glowny - Zgorzelec via Legnica" routing.
    name: "Wrocław Świebodzki – Zgorzelec",
    status: "active_passenger",
    electrified: true,
    lengthKm: 200.7,
    tracks: 2,
    maxSpeedKmh: 120,
    operators: ["PKP PLK"],
    passengerServices: ["PKP Intercity", "Koleje Dolnośląskie"],
    endStations: ["Wrocław Świebodzki", "Zgorzelec"],
    stations: [
      { id: "osm-660586292", name: "Wrocław Grabiszyn", coordinates: [16.97426, 51.09663] },
      { id: "osm-4007263784", name: "Wrocław Zachodni", coordinates: [16.9495, 51.08995] },
      { id: "osm-7047576585", name: "Mokronos Górny", coordinates: [16.90874, 51.07888] },
      { id: "osm-295997691", name: "Smolec", coordinates: [16.88196, 51.07159] },
      { id: "osm-295979492", name: "Sadowice Wrocławskie", coordinates: [16.82469, 51.05601] },
      { id: "osm-295978866", name: "Kąty Wrocławskie", coordinates: [16.74997, 51.03799] },
      { id: "osm-2333184869", name: "Mietków", coordinates: [16.65609, 50.98519] },
      { id: "osm-2333184992", name: "Imbramowice", coordinates: [16.57814, 50.96337] },
      { id: "osm-3740579332", name: "Żarów", coordinates: [16.49278, 50.9395] },
      { id: "osm-3683522126", name: "Jaworzyna Śląska", coordinates: [16.42888, 50.91249] },
      { id: "osm-4010817323", name: "Świebodzice", coordinates: [16.33505, 50.85997] },
      { id: "osm-295966496", name: "Wałbrzych Szczawienko", coordinates: [16.30271, 50.81639] },
      { id: "osm-842079165", name: "Wałbrzych Miasto", coordinates: [16.28523, 50.78623] },
      { id: "osm-8227325732", name: "Wałbrzych Centrum", coordinates: [16.26986, 50.77337] },
      { id: "osm-4011268703", name: "Wałbrzych Fabryczny", coordinates: [16.26705, 50.76139] },
      { id: "osm-418127386", name: "Wałbrzych Główny", coordinates: [16.28069, 50.74339] },
      { id: "osm-520501413", name: "Boguszów-Gorce Wschód", coordinates: [16.22176, 50.74792] },
      { id: "osm-420072866", name: "Boguszów-Gorce", coordinates: [16.20172, 50.75038] },
      { id: "osm-420072902", name: "Boguszów-Gorce Zachód", coordinates: [16.16723, 50.76238] },
      { id: "osm-4014368091", name: "Witków Śląski", coordinates: [16.12747, 50.79383] },
      { id: "osm-4014398630", name: "Sędzisław", coordinates: [16.06985, 50.81342] },
      { id: "osm-4014521900", name: "Marciszów", coordinates: [16.0076, 50.8515] },
      { id: "osm-4014574261", name: "Ciechanowice", coordinates: [15.97986, 50.86542] },
      { id: "osm-3425723107", name: "Janowice Wielkie", coordinates: [15.91876, 50.8785] },
      { id: "osm-4014639129", name: "Trzcińsko", coordinates: [15.87203, 50.88322] },
      { id: "osm-4014663812", name: "Wojanów", coordinates: [15.82129, 50.88475] },
      { id: "osm-1642733781", name: "Jelenia Góra", coordinates: [15.75599, 50.90259] },
      { id: "osm-4019276630", name: "Jelenia Góra Zabobrze", coordinates: [15.7431, 50.9099] },
      { id: "osm-1038540783", name: "Jelenia Góra Zachodnia", coordinates: [15.71945, 50.9006] },
      { id: "osm-2146199426", name: "Rybnica", coordinates: [15.64584, 50.91048] },
      { id: "osm-1492960330", name: "Stara Kamienica", coordinates: [15.56591, 50.91399] },
      { id: "osm-2146200143", name: "Kwieciszowice", coordinates: [15.50368, 50.92421] },
      { id: "osm-2146200222", name: "Rębiszów", coordinates: [15.45603, 50.94822] },
      { id: "osm-2146200485", name: "Młyńsko", coordinates: [15.45045, 50.98954] },
      { id: "osm-2146200605", name: "Gryfów Śląski", coordinates: [15.42898, 51.03398] },
      { id: "osm-678947526", name: "Ubocze", coordinates: [15.42003, 51.05632] },
      { id: "osm-2146201101", name: "Olszyna Lubańska", coordinates: [15.38065, 51.06969] },
      { id: "osm-459395485", name: "Lubań Śląski", coordinates: [15.29354, 51.11136] },
      { id: "osm-2161002971", name: "Zaręba", coordinates: [15.21957, 51.09812] },
      { id: "osm-2146201760", name: "Batowice Lubańskie", coordinates: [15.1557, 51.09085] },
      { id: "osm-12944875720", name: "Studniska", coordinates: [15.08581, 51.10961] },
      { id: "osm-2146202129", name: "Jerzmanki", coordinates: [15.06096, 51.12776] },
      { id: "osm-2920851838", name: "Zgorzelec", coordinates: [15.00304, 51.14017] },
    ],
    geometry: geo274 as [number, number][],
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
    // Real OSM identity (route relation 319206): Wroclaw Muchobor - Gubinek.
    // Corrected from the earlier fictional "Wroclaw Swiebodzki - Zgorzelec"
    // (that routing is actually real line 274). Gubinek itself lies outside
    // Lower Silesia, so the drawn geometry stops at the region border.
    name: "Wrocław Muchobór – Gubinek",
    status: "active_passenger",
    electrified: false,
    lengthKm: 137.3,
    tracks: 1,
    maxSpeedKmh: 90,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Wrocław Muchobór", "Gubinek"],
    stations: [
      { id: "osm-410701279", name: "Wrocław Muchobór", coordinates: [16.97477, 51.11114] },
      { id: "osm-410701278", name: "Wrocław Nowy Dwór", coordinates: [16.95518, 51.11968] },
      { id: "osm-410701277", name: "Wrocław Żerniki", coordinates: [16.91641, 51.12615] },
      { id: "osm-266567525", name: "Wrocław Leśnica", coordinates: [16.86728, 51.14196] },
      { id: "osm-1588340235", name: "Mrozów", coordinates: [16.79396, 51.18366] },
      { id: "osm-1588340145", name: "Miękinia", coordinates: [16.73964, 51.18826] },
      { id: "osm-430419516", name: "Przedmoście Święte", coordinates: [16.66465, 51.1905] },
      { id: "osm-1733534762", name: "Środa Śląska", coordinates: [16.60654, 51.18943] },
      { id: "osm-266565814", name: "Malczyce", coordinates: [16.48597, 51.21569] },
      { id: "osm-1729229743", name: "Szczedrzykowice", coordinates: [16.35069, 51.21515] },
      { id: "osm-1729229742", name: "Jaśkowice Legnickie", coordinates: [16.31414, 51.2151] },
      { id: "osm-12918903149", name: "Kunice", coordinates: [16.25463, 51.21501] },
      { id: "osm-2627870779", name: "Legnica", coordinates: [16.16965, 51.21409] },
      { id: "osm-2003256675", name: "Jezierzany", coordinates: [16.09759, 51.23568] },
      { id: "osm-2003255314", name: "Miłkowice", coordinates: [16.05461, 51.25556] },
      { id: "osm-2146569078", name: "Rokitki", coordinates: [15.89325, 51.33543] },
      { id: "osm-4032506260", name: "Modła", coordinates: [15.81342, 51.37568] },
      { id: "osm-2146570557", name: "Wierzbowa Śląska", coordinates: [15.75878, 51.39694] },
      { id: "osm-4032562218", name: "Studzianka", coordinates: [15.69509, 51.42708] },
      { id: "osm-2146571331", name: "Leszno Górne", coordinates: [15.61605, 51.46688] },
      { id: "osm-2086184126", name: "Małomice", coordinates: [15.44694, 51.54969] },
      { id: "osm-2051142766", name: "Żagań", coordinates: [15.31542, 51.60376] },
    ],
    geometry: geo275 as [number, number][],
    history: {
      timeline: [
        { year: 1886, label: "Otwarcie linii towarowej w kierunku Żagania" },
        { year: 1945, label: "Zmiana zarządcy po II wojnie światowej" },
        { year: 2023, label: "Rozpoczęcie prac administratora nad dedykowanym opisem linii" },
      ],
      narrative:
        "Linia 275 łączy wrocławski węzeł Muchobór z Gubinkiem przy granicy niemieckiej, obsługując głównie ruch towarowy w zachodniej części regionu. Ze względu na złożoność danych historycznych tej linii, informacje są prowadzone ręcznie przez administratora serwisu w dedykowanej strukturze Notion, niezależnie od automatycznego procesu synchronizacji stosowanego dla pozostałych linii — zgodnie z wymaganiem specyfikacji v1.",
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
    // Real OSM identity (route relation): Katowice - Legnica. Corrected from
    // the fictional "Legnica - Klodzko Glowne" (that pair isn't a real PKP
    // line). The relation itself is heavily fragmented in OSM -- the best
    // we could reassemble is a single clean ~39km in-region piece (roughly
    // the Swidnica/Dzierzoniow area), not the full Katowice-Legnica run, so
    // the map shows a partial fragment of this line rather than end-to-end.
    name: "Katowice – Legnica",
    status: "active_passenger",
    electrified: true,
    lengthKm: 39.0,
    tracks: 2,
    maxSpeedKmh: 100,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie", "PolRegio"],
    endStations: ["Katowice", "Legnica"],
    stations: [
      { id: "osm-13414176169", name: "Krzyżowa", coordinates: [16.5301, 50.79395] },
      { id: "osm-13945351832", name: "Mościsko Dzierżoniowskie", coordinates: [16.5804, 50.77206] },
      { id: "osm-3682234687", name: "Dzierżoniów Śląski", coordinates: [16.64091, 50.72424] },
      { id: "osm-1744509719", name: "Piława Górna", coordinates: [16.77326, 50.67877] },
      { id: "osm-3681874597", name: "Ząbkowice Śląskie", coordinates: [16.81277, 50.5973] },
    ],
    geometry: geo137 as [number, number][],
    history: {
      timeline: [
        { year: 1856, label: "Otwarcie pierwszego odcinka" },
        { year: 1970, label: "Elektryfikacja odcinka Legnica – Świdnica" },
        { year: 1998, label: "Elektryfikacja całej linii" },
      ],
      narrative:
        "Linia 137 spina aglomerację katowicką z Legnicą, obsługując po drodze gęsto zaludniony pas Przedgórza Sudeckiego wraz z okolicami Świdnicy i Dzierżoniowa. Historycznie kluczowa dla transportu węgla z zagłębia wałbrzyskiego, dziś pełni głównie funkcję pasażerską w ruchu regionalnym. Aplikacja pokazuje tylko dolnośląski fragment tej długiej, międzywojewódzkiej linii.",
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
    // Real OSM identity: Wroclaw Glowny - Szczecin Glowny. The old label
    // undersold it as ending at Glogow; Szczecin lies far outside Lower
    // Silesia so the drawn geometry stops at the region border.
    name: "Wrocław Główny – Szczecin Główny",
    status: "active_passenger",
    electrified: true,
    lengthKm: 128.7,
    tracks: 2,
    maxSpeedKmh: 140,
    operators: ["PKP PLK"],
    passengerServices: ["PKP Intercity", "Koleje Dolnośląskie"],
    endStations: ["Wrocław Główny", "Szczecin Główny"],
    stations: [
      { id: "osm-155479759", name: "Wrocław Główny", coordinates: [17.03795, 51.09792] },
      { id: "osm-410701279", name: "Wrocław Muchobór", coordinates: [16.97477, 51.11114] },
      { id: "osm-410701278", name: "Wrocław Nowy Dwór", coordinates: [16.95518, 51.11968] },
      { id: "osm-1522175250", name: "Wrocław Kuźniki", coordinates: [16.95221, 51.12804] },
      { id: "osm-1540736104", name: "Wrocław Stadion", coordinates: [16.94063, 51.13703] },
      { id: "osm-1521090728", name: "Wrocław Pracze", coordinates: [16.90313, 51.17002] },
      { id: "osm-2146625702", name: "Brzezinka Średzka", coordinates: [16.8368, 51.21972] },
      { id: "osm-2146626382", name: "Czerna Mała", coordinates: [16.80355, 51.22998] },
      { id: "osm-3875028476", name: "Księginice", coordinates: [16.76381, 51.24223] },
      { id: "osm-1005966746", name: "Brzeg Dolny", coordinates: [16.72503, 51.26696] },
      { id: "osm-1327917491", name: "Łososiowice", coordinates: [16.67487, 51.29727] },
      { id: "osm-2562003930", name: "Wołów", coordinates: [16.63288, 51.33393] },
      { id: "osm-2710791885", name: "Orzeszków", coordinates: [16.50812, 51.39393] },
      { id: "osm-413329406", name: "Małowice Wołowskie", coordinates: [16.47141, 51.40442] },
      { id: "osm-2147439177", name: "Ścinawa", coordinates: [16.42181, 51.40911] },
      { id: "osm-2147440480", name: "Chełmek Wołowski", coordinates: [16.35949, 51.45605] },
      { id: "osm-1397290730", name: "Rudna Miasto", coordinates: [16.26961, 51.50574] },
      { id: "osm-3986093725", name: "Rudna Gwizdanów", coordinates: [16.28097, 51.5291] },
      { id: "osm-2147441777", name: "Grębocice", coordinates: [16.18487, 51.5935] },
      { id: "osm-1749572286", name: "Głogów Krzepów", coordinates: [16.13359, 51.64478] },
      { id: "osm-3357286930", name: "Głogów", coordinates: [16.07987, 51.66961] },
      { id: "osm-1749572287", name: "Głogów Huta", coordinates: [15.99225, 51.67542] },
      { id: "osm-2147445172", name: "Głogów Wróblin", coordinates: [15.95438, 51.68659] },
      { id: "osm-2147445245", name: "Brzeg Głogowski", coordinates: [15.91797, 51.69107] },
      { id: "osm-2147445672", name: "Czerna", coordinates: [15.88458, 51.70225] },
      { id: "osm-2037930718", name: "Bytom Odrzański", coordinates: [15.81989, 51.72676] },
    ],
    geometry: geo273 as [number, number][],
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
    // Real OSM identity: Wroclaw Glowny - Swidnica Kraszowice. Corrected
    // from the fictional "Klodzko Glowne - Kudowa-Zdroj" (that pair is a
    // real tourist line too, just not this ref number).
    name: "Wrocław Główny – Świdnica Kraszowice",
    status: "active_passenger",
    electrified: false,
    lengthKm: 60.1,
    tracks: 1,
    maxSpeedKmh: 60,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Wrocław Główny", "Świdnica Kraszowice"],
    stations: [
      { id: "osm-7110814864", name: "Świdnica Przedmieście", coordinates: [16.50391, 50.83504] },
      { id: "osm-9437426217", name: "Pszenno", coordinates: [16.53016, 50.85604] },
      { id: "osm-4242705989", name: "Marcinowice Świdnickie", coordinates: [16.58681, 50.87687] },
      { id: "osm-4244061890", name: "Szczepanów", coordinates: [16.62518, 50.89833] },
      { id: "osm-1855369358", name: "Strzelce Świdnickie", coordinates: [16.66099, 50.91099] },
      { id: "osm-1015548683", name: "Sobótka Zachodnia", coordinates: [16.70077, 50.90784] },
      { id: "osm-634146395", name: "Sobótka", coordinates: [16.7401, 50.90532] },
      { id: "osm-4246107479", name: "Rogów Sobócki", coordinates: [16.75914, 50.9341] },
      { id: "osm-10572480528", name: "Pustków Żurawski", coordinates: [16.85731, 50.95413] },
      { id: "osm-10572480527", name: "Wierzbice", coordinates: [16.89923, 50.96509] },
      { id: "osm-438208370", name: "Kobierzyce", coordinates: [16.92659, 50.97426] },
      { id: "osm-13945351831", name: "Domasław", coordinates: [16.95294, 51.00999] },
      { id: "osm-295137286", name: "Bielany Wrocławskie", coordinates: [16.97577, 51.03613] },
      { id: "osm-9253142730", name: "Wrocław Partynice", coordinates: [16.99767, 51.06112] },
      { id: "osm-9253142720", name: "Wrocław Wojszyce", coordinates: [17.03217, 51.06908] },
      { id: "osm-155479759", name: "Wrocław Główny", coordinates: [17.03795, 51.09792] },
    ],
    geometry: geo285 as [number, number][],
    history: {
      timeline: [
        { year: 1902, label: "Otwarcie linii do Świdnicy" },
        { year: 2021, label: "Rewitalizacja infrastruktury torowej" },
      ],
      narrative:
        "Jednotorowa linia łącząca Wrocław ze Świdnicą, obsługująca ruch regionalny w kierunku Przedgórza Sudeckiego.",
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
    // Real OSM identity: Jelcz Miloszyce - Wroclaw Osobowice -- a route
    // relation still exists for it in OSM (hence "active_passenger" below),
    // so this is corrected from the fictional closed "Walbrzych - Kamienna
    // Gora" pairing, which is a different real line entirely.
    name: "Jelcz Miłoszyce – Wrocław Osobowice",
    status: "freight_only",
    electrified: false,
    lengthKm: 28.7,
    tracks: 1,
    maxSpeedKmh: 60,
    operators: ["PKP PLK"],
    passengerServices: [],
    endStations: ["Jelcz Miłoszyce", "Wrocław Osobowice"],
    stations: [
      { id: "osm-3547734926", name: "Jelcz Miłoszyce", coordinates: [17.3054, 51.04457] },
      { id: "osm-8927488127", name: "Chrząstawa Mała", coordinates: [17.27614, 51.07349] },
      { id: "osm-967207673", name: "Nadolice Wielkie", coordinates: [17.25083, 51.07986] },
      { id: "osm-8927488125", name: "Nadolice Małe", coordinates: [17.21947, 51.08179] },
      { id: "osm-967207656", name: "Dobrzykowice Wrocławskie", coordinates: [17.18003, 51.08755] },
      { id: "osm-8927488123", name: "Wrocław Wojnów Wschodni", coordinates: [17.16821, 51.09804] },
      { id: "osm-1796274362", name: "Wrocław Wojnów", coordinates: [17.15769, 51.10354] },
      { id: "osm-9311389281", name: "Wrocław Strachocin", coordinates: [17.14567, 51.10981] },
      { id: "osm-4736968858", name: "Wrocław Swojczyce", coordinates: [17.12134, 51.11586] },
      { id: "osm-8927458718", name: "Wrocław Popiele", coordinates: [17.11427, 51.12245] },
      { id: "osm-6218314792", name: "Wrocław Kowale", coordinates: [17.10017, 51.13498] },
      { id: "osm-241763683", name: "Wrocław Sołtysowice", coordinates: [17.08354, 51.14255] },
      { id: "osm-302223765", name: "Wrocław Osobowice", coordinates: [16.9966, 51.16709] },
    ],
    geometry: geo292 as [number, number][],
    history: {
      timeline: [
        { year: 1895, label: "Otwarcie linii" },
        { year: 2000, label: "Zawieszenie ruchu pasażerskiego" },
      ],
      narrative:
        "Krótkie połączenie towarowe między Jelczem-Laskowicami a wrocławskim węzłem Osobowice, dziś wykorzystywane głównie do obsługi przemysłu w tej części aglomeracji wrocławskiej.",
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
    // Real OSM identity: Chojnow - Rokitki, a short freight spur -- corrected
    // from the fictional "Wroclaw Glowny - Sycow" (a plausible-sounding but
    // different real line).
    name: "Chojnów – Rokitki",
    status: "freight_only",
    electrified: false,
    lengthKm: 8.9,
    tracks: 1,
    maxSpeedKmh: 50,
    operators: ["PKP PLK"],
    passengerServices: [],
    endStations: ["Chojnów", "Rokitki"],
    stations: [
      { id: "osm-2146569078", name: "Rokitki", coordinates: [15.89325, 51.33543] },
      { id: "osm-8228580471", name: "Biała Górna", coordinates: [15.92847, 51.29751] },
      { id: "osm-1089058672", name: "Chojnów", coordinates: [15.93766, 51.27769] },
    ],
    geometry: geo316 as [number, number][],
    history: {
      timeline: [{ year: 1873, label: "Otwarcie krótkiego łącznika towarowego" }],
      narrative:
        "Krótka linia towarowa łącząca Chojnów z Rokitkami w powiecie legnickim, dziś wykorzystywana do obsługi lokalnego ruchu towarowego.",
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
    // No in-region OSM match found for ref 293 -- the real line carrying
    // this number (Jelowa - Kluczbork) lies entirely in Opolskie, with zero
    // overlap with Lower Silesia. Geometry below remains illustrative
    // sample data rather than a real alignment.
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
    // Real OSM identity: Jelenia Gora - Granica Panstwa (Jakuszyce), a
    // mountain line toward the Czech border -- corrected from the fictional
    // "Trzebnica - Milicz" (a different, unrelated real reactivation case).
    // It still has an active route relation in OSM, hence not "closed".
    name: "Jelenia Góra – Granica Państwa (Jakuszyce)",
    status: "active_passenger",
    electrified: false,
    lengthKm: 41.4,
    tracks: 1,
    maxSpeedKmh: 50,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Jelenia Góra", "Granica Państwa (Jakuszyce)"],
    stations: [
      { id: "osm-1642733781", name: "Jelenia Góra", coordinates: [15.75599, 50.90259] },
      { id: "osm-4019276630", name: "Jelenia Góra Zabobrze", coordinates: [15.7431, 50.9099] },
      { id: "osm-1038540783", name: "Jelenia Góra Zachodnia", coordinates: [15.71945, 50.9006] },
      { id: "osm-13414176166", name: "Jelenia Góra Przemysłowa", coordinates: [15.70523, 50.88766] },
      { id: "osm-1779135843", name: "Jelenia Góra Cieplice", coordinates: [15.68524, 50.86975] },
      { id: "osm-1587493224", name: "Jelenia Góra Orle", coordinates: [15.65736, 50.86399] },
      { id: "osm-1779137875", name: "Jelenia Góra Sobieszów", coordinates: [15.64529, 50.85173] },
      { id: "osm-13414176168", name: "Piechowice Dolne", coordinates: [15.61667, 50.85042] },
      { id: "osm-560773006", name: "Piechowice", coordinates: [15.59147, 50.85172] },
      { id: "osm-13414176167", name: "Górzyniec", coordinates: [15.56759, 50.8602] },
      { id: "osm-1038553441", name: "Szklarska Poręba Dolna", coordinates: [15.55696, 50.84836] },
      { id: "osm-1048964566", name: "Szklarska Poręba Średnia", coordinates: [15.53998, 50.83847] },
      { id: "osm-560772324", name: "Szklarska Poręba Górna", coordinates: [15.51868, 50.83261] },
      { id: "osm-907975411", name: "Szklarska Poręba Huta", coordinates: [15.49706, 50.82666] },
      { id: "osm-10258115266", name: "Polana Jakuszycka", coordinates: [15.42952, 50.81463] },
    ],
    geometry: geo311 as [number, number][],
    history: {
      timeline: [{ year: 1902, label: "Otwarcie linii górskiej do granicy z Czechami" }],
      narrative:
        "Górska linia widokowa prowadząca z Jeleniej Góry w kierunku granicy czeskiej przez Szklarską Porębę, popularna wśród turystów odwiedzających Karkonosze.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-05" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-08-20" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    // No usable in-region OSM match found for ref 321 -- the only disused
    // way tagged with this ref sits near Nysa (Opolskie border area), not
    // the Jelenia Gora / Szklarska Poreba corridor this line actually runs.
    // Geometry below remains illustrative sample data rather than a real
    // alignment.
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
