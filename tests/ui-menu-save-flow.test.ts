import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import {
  UI_ASSET_IDS,
  UiAssetKeys,
  UiAssetRegistry,
  getUiAssetPublicUrl,
  getUiAssetStatus
} from "../client/src/assets/uiAssetRegistry";
import { ActiveSaveStore } from "../client/src/save/ActiveSaveStore";
import { SaveManager, type SaveDataV01, type SaveSlotState } from "../client/src/save/SaveManager";

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("fullscreen UI asset registry", () => {
  test("maps stable menu and save-select keys to Phaser public URLs without requiring every optional file to exist", () => {
    expect(UiAssetKeys.mainMenuBackground).toBe("ui_main_menu_background");
    expect(UiAssetKeys.saveSelectBackground).toBe("ui_save_select_background");
    expect(UiAssetKeys.titleLogo).toBe("ui_title_pve_lianjiban");
    expect(UiAssetKeys.filledSlotHover).toBe("ui_save_slot_filled_load_hover");

    expect(UI_ASSET_IDS).toContain("ui_button_start_normal");
    expect(UI_ASSET_IDS).toContain("ui_dark_overlay_panel");

    for (const assetId of UI_ASSET_IDS) {
      const entry = UiAssetRegistry[assetId];
      expect(entry.id).toBe(assetId);
      expect(entry.key).toBe(assetId);
      expect(entry.path).toBe(`assets/art/ui/${assetId}.png`);
      expect(getUiAssetPublicUrl(entry)).toBe(`/art/ui/${assetId}.png`);
      expect(["available", "missing"]).toContain(getUiAssetStatus(assetId));
    }

    expect(getUiAssetStatus(UiAssetKeys.titleLogo)).toBe("available");
    expect(existsSync(resolve(process.cwd(), UiAssetRegistry[UiAssetKeys.titleLogo].path))).toBe(true);
    expect(getUiAssetStatus(UiAssetKeys.mainMenuBackground)).toBe("missing");
    expect(getUiAssetStatus(UiAssetKeys.saveSelectBackground)).toBe("missing");
    expect(getUiAssetStatus(UiAssetKeys.filledSlotHover)).toBe("missing");
  });
});

describe("SaveManager V0.1 local slots", () => {
  let storage: MemoryStorage;
  let manager: SaveManager;

  beforeEach(() => {
    storage = new MemoryStorage();
    manager = new SaveManager(storage);
    ActiveSaveStore.clear();
  });

  test("starts with three empty slots and creates a default save in the requested slot", () => {
    expect(manager.getAllSlots()).toEqual([
      { slotId: 1, exists: false },
      { slotId: 2, exists: false },
      { slotId: 3, exists: false }
    ]);

    const save = manager.createSave(2);

    expect(save).toMatchObject({
      version: "0.1.0",
      slotId: 2,
      exists: true,
      saveName: "存档 2",
      players: {
        playerA: { playerId: "player_a", displayName: "玩家 A" },
        playerB: { playerId: "player_b", displayName: "玩家 B" }
      },
      progression: {
        completedRuns: 0,
        unlockedPlants: [],
        unlockedWeapons: [],
        unlockedBosses: []
      },
      world: {
        currentStageId: "stage_01",
        difficulty: "normal"
      },
      stats: {
        totalRuns: 0,
        totalVictories: 0,
        totalDefeats: 0,
        totalEnemiesKilled: 0,
        totalBossKills: 0
      }
    } satisfies Partial<SaveDataV01>);
    expect(new Date(save.createdAt).toString()).not.toBe("Invalid Date");
    expect(manager.loadSave(2)?.saveName).toBe("存档 2");
    expect(isFilled(manager.getSlot(2))).toBe(true);
  });

  test("persists updates, ignores missing loads, and supports session active save state", () => {
    expect(manager.loadSave(1)).toBeNull();

    const created = manager.createSave(1);
    manager.updateSave(1, {
      saveName: "测试存档",
      progression: {
        ...created.progression,
        completedRuns: 3,
        lastResult: "VICTORY"
      }
    });

    const loaded = manager.loadSave(1);
    expect(loaded?.saveName).toBe("测试存档");
    expect(loaded?.progression.completedRuns).toBe(3);
    expect(loaded?.progression.lastResult).toBe("VICTORY");
    expect(loaded?.updatedAt).not.toBe(created.updatedAt);

    if (!loaded) {
      throw new Error("Expected save to load.");
    }
    ActiveSaveStore.setActiveSave(loaded);
    expect(ActiveSaveStore.getActiveSave()?.slotId).toBe(1);

    manager.deleteSave(1);
    expect(manager.loadSave(1)).toBeNull();
    expect(manager.getSlot(1)).toEqual({ slotId: 1, exists: false });
  });
});

function isFilled(slot: SaveSlotState): boolean {
  return slot.exists;
}
