export type Page = "overview" | "now" | "align" | "window" | "path" | "shadow";
export interface SavedLocation { name: string; lat: number; lon: number; }
export const LOCATIONS: SavedLocation[] = [
  { name: "Hoboken", lat: 40.7430, lon: -74.0324 },
  { name: "Marina Del Rey", lat: 33.9803, lon: -118.4517 },
  { name: "Boulder", lat: 40.0150, lon: -105.2705 },
  { name: "Moab", lat: 38.5733, lon: -109.5498 }
];
export const PAGE_ORDER: Page[] = ["overview","now","align","window","path","shadow"];

export const PAGE_HELP: Record<Page, { title: string; body: string }> = {
  overview: { title: "Overview", body: "Quick summary of sunrise, sunset, golden-hour timing, and overall solar direction for the selected location." },
  now: { title: "Sun Now", body: "Shows the current sun position in azimuth and elevation, plus what kind of light the camera is getting right now." },
  align: { title: "Align", body: "Helps you face the sun or line up the camera. Use it to see whether to turn left or right and how much to tilt up." },
  window: { title: "Window", body: "Shows the best backlight or golden-light shooting windows for the selected day and camera direction." },
  path: { title: "Path", body: "Shows a G2 sun path map directly on the glasses. It rotates with your phone heading so you can see where the sun travels." },
  shadow: { title: "Shadow", body: "Shows the direction and approximate length of shadows so you can judge contrast and building or terrain coverage." }
};
