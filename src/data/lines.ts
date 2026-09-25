import type { RailwayLine } from "../types";
import geo274 from "./geometry/274.json";
import geo275 from "./geometry/275.json";
import geo137 from "./geometry/137.json";
import geo273 from "./geometry/273.json";
import geo285 from "./geometry/285.json";
import geo292 from "./geometry/292.json";
import geo316 from "./geometry/316.json";
import geo311 from "./geometry/311.json";
import geo271 from "./geometry/271.json";
import geo276 from "./geometry/276.json";
import geo286 from "./geometry/286.json";
import geo309 from "./geometry/309.json";
import geo322 from "./geometry/322.json";
import geo326 from "./geometry/326.json";
import geo340 from "./geometry/340.json";
import geo283 from "./geometry/283.json";
import geo284 from "./geometry/284.json";
import geo132 from "./geometry/132.json";
import geo143 from "./geometry/143.json";

/**
 * Line geometry for 274, 275, 137, 273, 285, 292, 316, 311, 271, 276, 286,
 * 309, 322, 326, 340, 283, 284, 132 and 143 is real OpenStreetMap data (©
 * OpenStreetMap contributors, ODbL) — stitched from each line's
 * `route=railway` relation (or, for closed/disused lines, from ways tagged
 * railway=disused with a matching `ref`) and clipped to the Dolnośląskie
 * voivodeship. It is not surveyed-grade: 137 is only a partial in-region
 * fragment (its relation is too disconnected to reassemble fully) and 271
 * is a best-effort reconstruction stitched from several separate in-region
 * fragments of a line that mostly runs through Wielkopolskie — see the
 * per-line comments below for both. Lines 293 and 321 could not be matched
 * to real Dolnośląskie OSM data (293's ref belongs to an unrelated line
 * entirely in Opolskie; 321's fallback query matched an unrelated disused
 * way near Nysa) and keep hand-drawn straight-line sample geometry instead.
 *
 * Real intermediate stations are matched by proximity to each line's path
 * from a region-wide query of OSM `railway=station`/`halt` nodes (plus
 * `construction:railway`/`disused:railway` for stations mid-renovation on
 * newly reactivated lines, e.g. Zlotoryja on 284), keyed by each station's
 * OSM node id so a station served by multiple lines lists all of them.
 *
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
  {
    // Real OSM identity: Wroclaw Glowny - Poznan Glowny. Runs mostly through
    // Wielkopolskie; the relation's real in-region portion was scattered
    // across many small fragments near the region edge (Zmigrod/Oborniki
    // Slaskie corridor) rather than one clean chain, so this geometry is a
    // best-effort reconstruction, not a pixel-perfect alignment.
    id: "271",
    number: "271",
    name: "Wrocław Główny – Poznań Główny",
    status: "active_passenger",
    electrified: true,
    lengthKm: 79.5,
    tracks: 2,
    maxSpeedKmh: 100,
    operators: ["PKP PLK"],
    passengerServices: ["PKP Intercity", "Koleje Dolnośląskie"],
    endStations: ["Wrocław Główny", "Poznań Główny"],
    stations: [
      { id: "osm-1278381123", name: "Korzeńsko", coordinates: [16.87224, 51.5446] },
      { id: "osm-1278381140", name: "Garbce", coordinates: [16.89026, 51.51256] },
      { id: "osm-660810005", name: "Żmigród", coordinates: [16.90187, 51.47533] },
      { id: "osm-1154540415", name: "Skokowa", coordinates: [16.84894, 51.38708] },
      { id: "osm-302219048", name: "Osola", coordinates: [16.86563, 51.33833] },
      { id: "osm-302221812", name: "Oborniki Śląskie", coordinates: [16.90733, 51.29961] },
      { id: "osm-1947166706", name: "Pęgów", coordinates: [16.92712, 51.24719] },
      { id: "osm-302207573", name: "Szewce", coordinates: [16.95408, 51.21614] },
      { id: "osm-302223765", name: "Wrocław Osobowice", coordinates: [16.9966, 51.16709] },
      { id: "osm-2624571493", name: "Wrocław Różanka", coordinates: [17.00371, 51.13799] },
      { id: "osm-302208350", name: "Wrocław Popowice", coordinates: [17.00142, 51.12736] },
      { id: "osm-302223767", name: "Wrocław Mikołajów", coordinates: [16.99839, 51.1163] },
      { id: "osm-155479759", name: "Wrocław Główny", coordinates: [17.03795, 51.09792] },
    ],
    geometry: geo271 as [number, number][],
    history: {
      timeline: [{ year: 1856, label: "Otwarcie magistrali Wrocław – Poznań" }],
      narrative:
        "Ważna magistrala łącząca Wrocław z Poznaniem przez Żmigród i Rawicz, obsługiwana przez PKP Intercity oraz Koleje Dolnośląskie. Aplikacja pokazuje tylko dolnośląski fragment tej długiej, międzywojewódzkiej linii. Wcześniejsza wersja geometrii kończyła się kilkanaście kilometrów przed Wrocławiem; poprawiono ją tak, by faktycznie dochodziła do Wrocławia Głównego, z dodatkowymi przystankami (Wrocław Osobowice, Różanka, Popowice, Mikołajów) po drodze.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-23" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "276",
    number: "276",
    name: "Wrocław Główny – Międzylesie",
    status: "active_passenger",
    electrified: true,
    lengthKm: 129.5,
    tracks: 1,
    maxSpeedKmh: 90,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Wrocław Główny", "Międzylesie"],
    stations: [
      { id: "osm-1854224907", name: "Kłodzko Miasto", coordinates: [16.65824, 50.4346] },
      { id: "osm-1854218754", name: "Kłodzko Główne", coordinates: [16.65677, 50.45133] },
      { id: "osm-746759958", name: "Ławica", coordinates: [16.67087, 50.47767] },
      { id: "osm-746758106", name: "Bardo Śląskie", coordinates: [16.73408, 50.50485] },
      { id: "osm-746758076", name: "Bardo Przyłęk", coordinates: [16.75796, 50.50952] },
      { id: "osm-248216848", name: "Suszka", coordinates: [16.82437, 50.53084] },
      { id: "osm-10977746452", name: "Kamieniec Ząbkowicki", coordinates: [16.89898, 50.53614] },
      { id: "osm-496869965", name: "Starczów", coordinates: [16.94676, 50.56344] },
      { id: "osm-248216807", name: "Ziębice", coordinates: [17.03389, 50.60865] },
      { id: "osm-487097036", name: "Henryków", coordinates: [17.03014, 50.66308] },
      { id: "osm-487092286", name: "Biały Kościół", coordinates: [17.02995, 50.72846] },
      { id: "osm-746756710", name: "Warkocz", coordinates: [17.04622, 50.8296] },
      { id: "osm-413567246", name: "Żórawina", coordinates: [17.04958, 50.98342] },
      { id: "osm-510885402", name: "Smardzów Wrocławski", coordinates: [17.06613, 51.03069] },
      { id: "osm-9221292010", name: "Iwiny", coordinates: [17.06881, 51.05467] },
      { id: "osm-413351232", name: "Węgry", coordinates: [17.03282, 50.92579] },
      { id: "osm-746756709", name: "Boreczek", coordinates: [17.02458, 50.87893] },
      { id: "osm-413398658", name: "Strzelin", coordinates: [17.06024, 50.78421] },
    ],
    geometry: geo276 as [number, number][],
    history: {
      timeline: [{ year: 1874, label: "Otwarcie linii Wrocław – Kłodzko – Międzylesie" }],
      narrative:
        "Główna linia łącząca Wrocław z Kotliną Kłodzką i granicą czeską przez Strzelin, Ząbkowice Śląskie i Kłodzko, obsługiwana regularnie przez Koleje Dolnośląskie.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-23" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    // 286 has a minor cosmetic stitching artifact (a small loop near one
    // junction, from double-track duplication) -- still directionally
    // correct overall.
    id: "286",
    number: "286",
    name: "Kłodzko Główne – Wałbrzych Główny",
    status: "active_passenger",
    electrified: false,
    lengthKm: 55.4,
    tracks: 1,
    maxSpeedKmh: 60,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Kłodzko Główne", "Wałbrzych Główny"],
    stations: [
      { id: "osm-1854218754", name: "Kłodzko Główne", coordinates: [16.65677, 50.45133] },
      { id: "osm-2075243777", name: "Bierkowice", coordinates: [16.60505, 50.47554] },
      { id: "osm-410273634", name: "Gorzuchów Kłodzki", coordinates: [16.57179, 50.48974] },
      { id: "osm-1280940818", name: "Ścinawka Średnia", coordinates: [16.50544, 50.52636] },
      { id: "osm-12082778097", name: "Nowa Ruda", coordinates: [16.49681, 50.5773] },
      { id: "osm-12082777801", name: "Nowa Ruda Przedmieście", coordinates: [16.51604, 50.58842] },
      { id: "osm-12810654076", name: "Ludwikowice Kłodzkie", coordinates: [16.4813, 50.61947] },
      { id: "osm-2075274330", name: "Świerki Dolne", coordinates: [16.4325, 50.63239] },
      { id: "osm-2075289365", name: "Bartnica", coordinates: [16.40795, 50.64194] },
      { id: "osm-11015973337", name: "Głuszyca Górna", coordinates: [16.37139, 50.67285] },
      { id: "osm-11015973336", name: "Głuszyca", coordinates: [16.35399, 50.68787] },
      { id: "osm-2075308765", name: "Jedlina-Zdrój", coordinates: [16.34302, 50.71154] },
      { id: "osm-13414176172", name: "Jedlina-Zdrój Borowa", coordinates: [16.3221, 50.7299] },
      { id: "osm-418127386", name: "Wałbrzych Główny", coordinates: [16.28069, 50.74339] },
    ],
    geometry: geo286 as [number, number][],
    history: {
      timeline: [{ year: 1880, label: "Otwarcie linii przez Nową Rudę" }],
      narrative:
        "Regionalna linia łącząca Kłodzko z Wałbrzychem przez Nową Rudę, Ludwikowice Kłodzkie, Głuszycę i Jedlinę-Zdrój, obsługująca dojazdy mieszkańców Kotliny Kłodzkiej i Gór Sowich. Wcześniejsza wersja tej linii w aplikacji miała błędnie zrekonstruowaną geometrię (zawracającą w połowie trasy zamiast biec dalej w stronę Wałbrzycha) przez zduplikowane warianty toru w danych OSM; poprawiono ją na podstawie ręcznej analizy fragmentów trasy.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-23" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "309",
    number: "309",
    name: "Kłodzko Nowe – Kudowa-Zdrój",
    status: "active_passenger",
    electrified: false,
    lengthKm: 40.0,
    tracks: 1,
    maxSpeedKmh: 50,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Kłodzko Nowe", "Kudowa-Zdrój"],
    stations: [
      { id: "osm-248216912", name: "Kłodzko Książek", coordinates: [16.64092, 50.4157] },
      { id: "osm-2334430783", name: "Kłodzko Zagórze", coordinates: [16.61294, 50.41503] },
      { id: "osm-248216924", name: "Stary Wielisław", coordinates: [16.57627, 50.40518] },
      { id: "osm-5600204728", name: "Polanica-Zdrój", coordinates: [16.51441, 50.39759] },
      { id: "osm-3411151874", name: "Szczytna", coordinates: [16.44979, 50.40837] },
      { id: "osm-873825601", name: "Duszniki-Zdrój", coordinates: [16.38581, 50.40903] },
      { id: "osm-1280966256", name: "Kulin Kłodzki", coordinates: [16.32549, 50.41937] },
      { id: "osm-1864491167", name: "Lewin Kłodzki", coordinates: [16.27469, 50.40554] },
      { id: "osm-637065353", name: "Kudowa-Zdrój", coordinates: [16.2441, 50.4298] },
    ],
    geometry: geo309 as [number, number][],
    history: {
      timeline: [{ year: 1890, label: "Otwarcie linii do uzdrowiska Kudowa-Zdrój" }],
      narrative:
        "Turystyczna linia jednotorowa prowadząca z Kłodzka przez Polanicę-Zdrój i Duszniki-Zdrój do uzdrowiska Kudowa-Zdrój.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-23" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "322",
    number: "322",
    name: "Kłodzko Nowe – Stronie Śląskie",
    status: "active_passenger",
    electrified: false,
    lengthKm: 27.3,
    tracks: 1,
    maxSpeedKmh: 50,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Kłodzko Nowe", "Stronie Śląskie"],
    stations: [
      { id: "osm-700897059", name: "Krosnowice Kłodzkie", coordinates: [16.63689, 50.39235] },
      { id: "osm-410273695", name: "Żelazno", coordinates: [16.66783, 50.37101] },
      { id: "osm-1809455402", name: "Ołdrzychowice Kłodzkie", coordinates: [16.7079, 50.35864] },
      { id: "osm-11735251349", name: "Trzebieszowice", coordinates: [16.77669, 50.34358] },
      { id: "osm-13745823223", name: "Radochów", coordinates: [16.82062, 50.3389] },
      { id: "osm-11735251352", name: "Lądek Zdrój", coordinates: [16.85891, 50.34186] },
      { id: "osm-11735251350", name: "Lądek Stójków", coordinates: [16.87417, 50.32653] },
      { id: "osm-13645641419", name: "Stronie Śląskie", coordinates: [16.87394, 50.30075] },
    ],
    geometry: geo322 as [number, number][],
    history: {
      timeline: [{ year: 1897, label: "Otwarcie linii w kierunku Lądka-Zdroju" }],
      narrative:
        "Linia biegnąca doliną Białej Lądeckiej przez uzdrowisko Lądek-Zdrój do Stronia Śląskiego u podnóża Masywu Śnieżnika.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-23" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "326",
    number: "326",
    name: "Wrocław Psie Pole – Trzebnica",
    status: "active_passenger",
    electrified: false,
    lengthKm: 20.5,
    tracks: 1,
    maxSpeedKmh: 60,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Wrocław Psie Pole", "Trzebnica"],
    stations: [
      { id: "osm-1401192473", name: "Wrocław Psie Pole", coordinates: [17.11854, 51.15045] },
      { id: "osm-3623849395", name: "Wrocław Zakrzów", coordinates: [17.12219, 51.15874] },
      { id: "osm-358344842", name: "Wrocław Pawłowice", coordinates: [17.10838, 51.16878] },
      { id: "osm-3561494614", name: "Ramiszów", coordinates: [17.09834, 51.1932] },
      { id: "osm-10308843703", name: "Pasikurowice", coordinates: [17.10961, 51.20889] },
      { id: "osm-1803599530", name: "Siedlec Trzebnicki", coordinates: [17.11882, 51.23365] },
      { id: "osm-1272881984", name: "Pierwoszów Miłocin", coordinates: [17.09891, 51.25522] },
      { id: "osm-1112631418", name: "Brochocin Trzebnicki", coordinates: [17.09413, 51.27603] },
      { id: "osm-10308843617", name: "Trzebnica", coordinates: [17.06329, 51.30404] },
    ],
    geometry: geo326 as [number, number][],
    history: {
      timeline: [{ year: 1887, label: "Otwarcie linii Wrocław – Trzebnica" }],
      narrative:
        "Popularna linia podmiejska łącząca wrocławskie osiedle Psie Pole z Trzebnicą, obsługiwana szynobusami Kolei Dolnośląskich.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-23" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "340",
    number: "340",
    name: "Mysłakowice – Karpacz",
    status: "active_passenger",
    electrified: false,
    lengthKm: 7.2,
    tracks: 1,
    maxSpeedKmh: 40,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Mysłakowice", "Karpacz"],
    stations: [
      { id: "osm-11380011571", name: "Mysłakowice", coordinates: [15.78802, 50.83533] },
      { id: "osm-12871928025", name: "Mysłakowice Orzeł", coordinates: [15.78641, 50.82508] },
      { id: "osm-11831904332", name: "Miłków", coordinates: [15.76389, 50.80985] },
      { id: "osm-2136783800", name: "Karpacz", coordinates: [15.76165, 50.7825] },
    ],
    geometry: geo340 as [number, number][],
    history: {
      timeline: [
        { year: 1895, label: "Otwarcie linii do Karpacza" },
        { year: 2022, label: "Reaktywacja ruchu pasażerskiego dla turystów" },
      ],
      narrative:
        "Krótka górska linia do popularnego kurortu narciarskiego Karpacz u podnóża Śnieżki, po latach zawieszenia przywrócona do ruchu sezonowego dla turystów.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-23" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "283",
    number: "283",
    name: "Jelenia Góra – Żagań",
    status: "active_passenger",
    electrified: false,
    lengthKm: 104.7,
    tracks: 1,
    maxSpeedKmh: 70,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Jelenia Góra", "Żagań"],
    stations: [
      { id: "osm-1642733781", name: "Jelenia Góra", coordinates: [15.75599, 50.90259] },
      { id: "osm-4019276630", name: "Jelenia Góra Zabobrze", coordinates: [15.7431, 50.9099] },
      { id: "osm-687571373", name: "Jeżów Sudecki", coordinates: [15.73518, 50.92707] },
      { id: "osm-687472158", name: "Siedlęcin", coordinates: [15.68979, 50.94379] },
      { id: "osm-687469346", name: "Pilchowice Zapora", coordinates: [15.65431, 50.96871] },
      { id: "osm-684304509", name: "Pilchowice Nielestno", coordinates: [15.66146, 50.99184] },
      { id: "osm-4076629966", name: "Wleń", coordinates: [15.66893, 51.01594] },
      { id: "osm-2090528667", name: "Marczów", coordinates: [15.66468, 51.05094] },
      { id: "osm-1659116723", name: "Dębowy Gaj", coordinates: [15.64365, 51.07979] },
      { id: "osm-4038179767", name: "Lwówek Śląski", coordinates: [15.59353, 51.10995] },
      { id: "osm-4774182653", name: "Rakowice Wielkie", coordinates: [15.56293, 51.12682] },
      { id: "osm-1870523190", name: "Gościszów", coordinates: [15.44608, 51.15916] },
      { id: "osm-1870523193", name: "Nowogrodziec", coordinates: [15.39238, 51.19098] },
      { id: "osm-484742029", name: "Zebrzydowa", coordinates: [15.38917, 51.25468] },
      { id: "osm-4078166095", name: "Osiecznica Kliczków", coordinates: [15.41992, 51.33137] },
      { id: "osm-4082556431", name: "Luboszów", coordinates: [15.39007, 51.42566] },
      { id: "osm-4082597646", name: "Dobre nad Kwisą", coordinates: [15.36894, 51.52608] },
      { id: "osm-4082614260", name: "Trzebów", coordinates: [15.38402, 51.54573] },
      { id: "osm-2051142766", name: "Żagań", coordinates: [15.31542, 51.60376] },
    ],
    geometry: geo283 as [number, number][],
    history: {
      timeline: [{ year: 1865, label: "Otwarcie linii Jelenia Góra – Żagań" }],
      narrative:
        "Długa linia regionalna łącząca Kotlinę Jeleniogórską z Żaganiem przez Wleń, Lwówek Śląski i Nowogrodziec, obsługiwana szynobusami Kolei Dolnośląskich.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-23" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "284",
    number: "284",
    name: "Legnica – Lwówek Śląski",
    status: "active_passenger",
    electrified: false,
    lengthKm: 48.5,
    tracks: 1,
    maxSpeedKmh: 60,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Legnica", "Lwówek Śląski"],
    stations: [
      { id: "osm-4027715808", name: "Legnica Północna", coordinates: [16.1705, 51.21626] },
      { id: "osm-2627870779", name: "Legnica", coordinates: [16.16965, 51.21409] },
      { id: "osm-1733534431", name: "Pawłowice Małe", coordinates: [16.08514, 51.18142] },
      { id: "osm-9177093218", name: "Wilczyce", coordinates: [16.03417, 51.16515] },
      { id: "osm-9177093219", name: "Kozów", coordinates: [15.97367, 51.14311] },
      { id: "osm-1232406706", name: "Złotoryja", coordinates: [15.91374, 51.12896] },
      { id: "osm-2040352416", name: "Jerzmanice-Zdrój", coordinates: [15.89018, 51.11283] },
      { id: "osm-9208628876", name: "Pielgrzymka", coordinates: [15.81703, 51.11828] },
      { id: "osm-9212698207", name: "Nowa Wieś Grodziska", coordinates: [15.7333, 51.142] },
      { id: "osm-2043795916", name: "Skorzynice", coordinates: [15.68349, 51.13616] },
      { id: "osm-9558418677", name: "Płakowice", coordinates: [15.61514, 51.1189] },
      { id: "osm-4038179767", name: "Lwówek Śląski", coordinates: [15.59353, 51.10995] },
    ],
    geometry: geo284 as [number, number][],
    history: {
      timeline: [{ year: 1885, label: "Otwarcie linii Legnica – Lwówek Śląski" }],
      narrative:
        "Linia łącząca Legnicę ze Złotoryją i Lwówkiem Śląskim, w ostatnich latach zrewitalizowana wraz z przywróceniem regularnego ruchu pasażerskiego.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-23" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-23" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-23" },
    ],
  },
  {
    id: "132",
    number: "132",
    name: "Bytom – Wrocław Główny",
    status: "active_passenger",
    electrified: true,
    lengthKm: 42.7,
    tracks: 2,
    maxSpeedKmh: 120,
    operators: ["PKP PLK"],
    passengerServices: ["PKP Intercity", "Koleje Dolnośląskie"],
    endStations: ["Bytom", "Wrocław Główny"],
    stations: [
      { id: "osm-968778348", name: "Lipki", coordinates: [17.37252, 50.89825] },
      { id: "osm-242360270", name: "Oława", coordinates: [17.29776, 50.93058] },
      { id: "osm-12381011597", name: "Oława Zachodnia", coordinates: [17.26871, 50.94502] },
      { id: "osm-606349229", name: "Lizawice", coordinates: [17.21439, 50.97226] },
      { id: "osm-1817597365", name: "Zębice Wrocławskie", coordinates: [17.16207, 51.00667] },
      { id: "osm-413338538", name: "Święta Katarzyna", coordinates: [17.12314, 51.02956] },
      { id: "osm-1091838853", name: "Wrocław Brochów", coordinates: [17.08462, 51.06428] },
      { id: "osm-155479759", name: "Wrocław Główny", coordinates: [17.03795, 51.09792] },
    ],
    geometry: geo132 as [number, number][],
    history: {
      timeline: [{ year: 1843, label: "Otwarcie magistrali Wrocław – Górny Śląsk" }],
      narrative:
        "Ważna zelektryfikowana magistrala łącząca Wrocław z Górnym Śląskiem (Bytom) przez Oławę, obsługiwana przez PKP Intercity oraz Koleje Dolnośląskie. Aplikacja pokazuje tylko dolnośląski fragment tej długiej, międzywojewódzkiej linii — reszta trasy przebiega przez województwo śląskie i opolskie.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-25" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-25" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-25" },
    ],
  },
  {
    id: "143",
    number: "143",
    name: "Wrocław Mikołajów – Namysłów",
    status: "active_passenger",
    electrified: false,
    lengthKm: 60.5,
    tracks: 1,
    maxSpeedKmh: 80,
    operators: ["PKP PLK"],
    passengerServices: ["Koleje Dolnośląskie"],
    endStations: ["Wrocław Mikołajów", "Kalety"],
    stations: [
      { id: "osm-302223767", name: "Wrocław Mikołajów", coordinates: [16.99839, 51.1163] },
      { id: "osm-9067487855", name: "Wrocław Szczepin", coordinates: [17.01424, 51.12295] },
      { id: "osm-789996265", name: "Wrocław Nadodrze", coordinates: [17.03299, 51.12566] },
      { id: "osm-241763683", name: "Wrocław Sołtysowice", coordinates: [17.08354, 51.14255] },
      { id: "osm-1401192473", name: "Wrocław Psie Pole", coordinates: [17.11854, 51.15045] },
      { id: "osm-11407068398", name: "Mirków", coordinates: [17.16547, 51.16549] },
      { id: "osm-3607481169", name: "Długołęka", coordinates: [17.19445, 51.17846] },
      { id: "osm-295396299", name: "Borowa Oleśnicka", coordinates: [17.27609, 51.18411] },
      { id: "osm-295374333", name: "Oleśnica", coordinates: [17.38592, 51.20066] },
      { id: "osm-295374382", name: "Solniki Wielkie", coordinates: [17.46573, 51.16411] },
      { id: "osm-295374533", name: "Bierutów", coordinates: [17.54612, 51.12844] },
      { id: "osm-295374531", name: "Wilków Namysłowski", coordinates: [17.65841, 51.09424] },
      { id: "osm-295374525", name: "Namysłów", coordinates: [17.7169, 51.07443] },
    ],
    geometry: geo143 as [number, number][],
    history: {
      timeline: [{ year: 1868, label: "Otwarcie linii Wrocław – Kluczbork" }],
      narrative:
        "Jednotorowa, niezelektryfikowana linia łącząca Wrocław z Górnym Śląskiem (Kalety) przez Oleśnicę i Namysłów. Aplikacja pokazuje fragment od Wrocławia Mikołajowa po Namysłów; region Namysłowa leży administracyjnie już w województwie opolskim, ale mieści się w uproszczonej granicy regionu użytej w tej aplikacji (patrz src/data/regionBorder.ts) — dalsza trasa do Kluczborka, Tarnowskich Gór i Kalet nie jest pokazana.",
      photos: [],
    },
    tenders: [],
    sources: [
      { section: "overview", label: "PKP PLK — wykaz linii kolejowych", lastUpdated: "2026-09-25" },
      { section: "history", label: "Atlas linii kolejowych w Polsce", lastUpdated: "2026-09-25" },
      { section: "tenders", label: "Platforma zakupowa PLK", url: "https://przetargi.plk-sa.pl", lastUpdated: "2026-09-25" },
    ],
  },
];

export function findLineByNumber(number: string): RailwayLine | undefined {
  return lines.find((l) => l.number === number);
}
