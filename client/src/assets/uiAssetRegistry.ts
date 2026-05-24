export const UiAssetKeys = {
  mainMenuBackground: "ui_main_menu_background",
  saveSelectBackground: "ui_save_select_background",
  titleLogo: "ui_title_pve_lianjiban",
  titleBackplate: "ui_title_backplate",
  mainMenuButtonPanel: "ui_main_menu_button_panel",
  startButtonNormal: "ui_button_start_normal",
  startButtonHover: "ui_button_start_hover",
  startButtonPressed: "ui_button_start_pressed",
  settingsButtonNormal: "ui_button_settings_normal",
  settingsButtonHover: "ui_button_settings_hover",
  settingsButtonPressed: "ui_button_settings_pressed",
  saveSelectFrame: "ui_save_select_frame",
  saveSlotPanelBase: "ui_save_slot_panel_base",
  saveSlotEmpty: "ui_save_slot_empty_create",
  saveSlotEmptyHover: "ui_save_slot_empty_create_hover",
  saveSlotFilled: "ui_save_slot_filled_load",
  filledSlotHover: "ui_save_slot_filled_load_hover",
  saveSlotFilledNoText: "ui_save_slot_filled_base_no_text",
  saveSlotEmptyNoText: "ui_save_slot_empty_base_no_text",
  iconCreateSave: "ui_icon_create_save_plus",
  iconSaveFile: "ui_icon_save_file",
  iconTwoPlayers: "ui_icon_two_players",
  iconSettings: "ui_icon_settings_gear",
  cornerDecorSet: "ui_corner_decor_set",
  dividerHorizontal: "ui_divider_line_horizontal",
  dividerVertical: "ui_divider_line_vertical",
  darkOverlayPanel: "ui_dark_overlay_panel",
  largeBlankButton: "ui_button_large_blank",
  mediumBlankButton: "ui_button_medium_blank",
  smallInfoTag: "ui_small_info_tag"
} as const;

export type UiAssetId = (typeof UiAssetKeys)[keyof typeof UiAssetKeys];
export type UiAssetStatus = "available" | "missing";
export type UiAssetFallback = "phaser_graphics";

export type UiAssetEntry = {
  id: UiAssetId;
  key: UiAssetId;
  path: string;
  status: UiAssetStatus;
  fallback: UiAssetFallback;
  description: string;
};

export const UI_ASSET_IDS = Object.values(UiAssetKeys);

const MISSING_UI_ASSET_IDS = new Set<UiAssetId>([
  UiAssetKeys.mainMenuBackground,
  UiAssetKeys.saveSelectBackground,
  UiAssetKeys.filledSlotHover
]);

const UI_ASSET_DESCRIPTIONS: Record<UiAssetId, string> = {
  ui_main_menu_background: "Fullscreen main menu background.",
  ui_save_select_background: "Fullscreen save selection background.",
  ui_title_pve_lianjiban: "Chinese PVE co-op title logo.",
  ui_title_backplate: "Decorative title logo backplate.",
  ui_main_menu_button_panel: "Decorative panel behind main menu buttons.",
  ui_button_start_normal: "Start button normal state.",
  ui_button_start_hover: "Start button hover state.",
  ui_button_start_pressed: "Start button pressed state.",
  ui_button_settings_normal: "Settings button normal state.",
  ui_button_settings_hover: "Settings button hover state.",
  ui_button_settings_pressed: "Settings button pressed state.",
  ui_save_select_frame: "Large save selection frame.",
  ui_save_slot_panel_base: "Generic save slot panel.",
  ui_save_slot_empty_create: "Empty save slot create state.",
  ui_save_slot_empty_create_hover: "Empty save slot hover state.",
  ui_save_slot_filled_load: "Filled save slot load state.",
  ui_save_slot_filled_load_hover: "Filled save slot hover state.",
  ui_save_slot_filled_base_no_text: "Filled save slot panel without text.",
  ui_save_slot_empty_base_no_text: "Empty save slot panel without text.",
  ui_icon_create_save_plus: "Create-save plus icon.",
  ui_icon_save_file: "Save file icon.",
  ui_icon_two_players: "Two-player info icon.",
  ui_icon_settings_gear: "Settings gear icon.",
  ui_corner_decor_set: "Reusable decorative corner pieces.",
  ui_divider_line_horizontal: "Horizontal decorative divider.",
  ui_divider_line_vertical: "Vertical decorative divider.",
  ui_dark_overlay_panel: "Semi-transparent dark readability panel.",
  ui_button_large_blank: "Large blank button base.",
  ui_button_medium_blank: "Medium blank button base.",
  ui_small_info_tag: "Small info tag panel."
};

export const UiAssetRegistry = Object.fromEntries(
  UI_ASSET_IDS.map((id) => [
    id,
    entry({
      id,
      description: UI_ASSET_DESCRIPTIONS[id],
      status: MISSING_UI_ASSET_IDS.has(id) ? "missing" : "available"
    })
  ])
) as Record<UiAssetId, UiAssetEntry>;

export function getUiAssetPublicUrl(entry: UiAssetEntry): string {
  return `/${entry.path.replace(/^assets\//, "")}`;
}

export function getUiAssetStatus(assetId: UiAssetId): UiAssetStatus {
  return UiAssetRegistry[assetId].status;
}

function entry(config: Pick<UiAssetEntry, "id" | "description" | "status">): UiAssetEntry {
  return {
    ...config,
    key: config.id,
    path: `assets/art/ui/${config.id}.png`,
    fallback: "phaser_graphics"
  };
}
