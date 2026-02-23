// Solar Icons 离线预加载
// 在应用启动时将整个 Solar 图标集加载到 Iconify 缓存，避免在线请求
import { addCollection } from "@iconify/react";
import solarIcons from "@iconify-json/solar/icons.json";

export function loadSolarIcons() {
  addCollection(solarIcons as any);
}
