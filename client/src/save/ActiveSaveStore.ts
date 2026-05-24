import type { SaveDataV01 } from "./SaveManager";

let activeSave: SaveDataV01 | undefined;

export const SAVE_SELECTED_EVENT = "pve-save-selected";

export const ActiveSaveStore = {
  getActiveSave(): SaveDataV01 | undefined {
    return activeSave;
  },

  setActiveSave(save: SaveDataV01): void {
    activeSave = save;
  },

  clear(): void {
    activeSave = undefined;
  }
};

export function getActiveSave(): SaveDataV01 | undefined {
  return ActiveSaveStore.getActiveSave();
}

export function setActiveSave(save: SaveDataV01): void {
  ActiveSaveStore.setActiveSave(save);
}
