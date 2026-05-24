export const SAVE_STORAGE_KEY = "pve_coop_saves_v0_1";

export type SaveSlotId = 1 | 2 | 3;

export type PlayerSaveInfo = {
  playerId: string;
  displayName: string;
  heroSkinId?: string;
  preferredColor?: string;
  lastSelectedEvolutionPath?: "firepower" | "control" | "support";
};

export type SaveDataV01 = {
  version: "0.1.0";
  slotId: SaveSlotId;
  exists: true;
  saveName: string;
  createdAt: string;
  updatedAt: string;
  players: {
    playerA: PlayerSaveInfo;
    playerB: PlayerSaveInfo;
  };
  progression: {
    completedRuns: number;
    bestClearTimeSeconds?: number;
    lastResult?: "VICTORY" | "DEFEAT";
    unlockedPlants: string[];
    unlockedWeapons: string[];
    unlockedBosses: string[];
  };
  world: {
    currentStageId: string;
    difficulty: "normal";
  };
  stats: {
    totalRuns: number;
    totalVictories: number;
    totalDefeats: number;
    totalEnemiesKilled: number;
    totalBossKills: number;
  };
  settingsSnapshot?: {
    musicVolume?: number;
    sfxVolume?: number;
  };
};

export type SaveSlotState =
  | {
      slotId: SaveSlotId;
      exists: false;
    }
  | SaveDataV01;

const SLOT_IDS = [1, 2, 3] as const satisfies readonly SaveSlotId[];

type PersistedSaves = Partial<Record<SaveSlotId, SaveDataV01>>;

export class SaveManager {
  constructor(private readonly storage: Storage = getDefaultStorage()) {}

  getAllSlots(): SaveSlotState[] {
    return SLOT_IDS.map((slotId) => this.getSlot(slotId));
  }

  getSlot(slotId: SaveSlotId): SaveSlotState {
    return this.readSaves()[slotId] ?? { slotId, exists: false };
  }

  createSave(slotId: SaveSlotId): SaveDataV01 {
    const saves = this.readSaves();
    const save = createDefaultSave(slotId);
    saves[slotId] = save;
    this.writeSaves(saves);
    return cloneSave(save);
  }

  loadSave(slotId: SaveSlotId): SaveDataV01 | null {
    const save = this.readSaves()[slotId];
    return save ? cloneSave(save) : null;
  }

  updateSave(slotId: SaveSlotId, patch: Partial<SaveDataV01>): void {
    const saves = this.readSaves();
    const current = saves[slotId];
    if (!current) {
      return;
    }

    const updated: SaveDataV01 = {
      ...current,
      ...patch,
      version: "0.1.0",
      slotId,
      exists: true,
      createdAt: current.createdAt,
      updatedAt: nextUpdatedAt(current.updatedAt)
    };
    saves[slotId] = updated;
    this.writeSaves(saves);
  }

  deleteSave(slotId: SaveSlotId): void {
    const saves = this.readSaves();
    delete saves[slotId];
    this.writeSaves(saves);
  }

  private readSaves(): PersistedSaves {
    const raw = this.storage.getItem(SAVE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") {
        return {};
      }

      const saves: PersistedSaves = {};
      for (const slotId of SLOT_IDS) {
        const candidate = (parsed as Record<string, unknown>)[String(slotId)];
        if (isSaveDataV01(candidate) && candidate.slotId === slotId) {
          saves[slotId] = candidate;
        }
      }
      return saves;
    } catch {
      return {};
    }
  }

  private writeSaves(saves: PersistedSaves): void {
    this.storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saves));
  }
}

function createDefaultSave(slotId: SaveSlotId): SaveDataV01 {
  const now = new Date().toISOString();
  return {
    version: "0.1.0",
    slotId,
    exists: true,
    saveName: `存档 ${slotId}`,
    createdAt: now,
    updatedAt: now,
    players: {
      playerA: {
        playerId: "player_a",
        displayName: "玩家 A"
      },
      playerB: {
        playerId: "player_b",
        displayName: "玩家 B"
      }
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
  };
}

function nextUpdatedAt(previousIso: string): string {
  const now = new Date();
  const previousMs = Date.parse(previousIso);
  if (Number.isFinite(previousMs) && now.getTime() <= previousMs) {
    return new Date(previousMs + 1).toISOString();
  }
  return now.toISOString();
}

function cloneSave(save: SaveDataV01): SaveDataV01 {
  return JSON.parse(JSON.stringify(save)) as SaveDataV01;
}

function isSaveDataV01(value: unknown): value is SaveDataV01 {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<SaveDataV01>;
  return (
    candidate.version === "0.1.0" &&
    candidate.exists === true &&
    isSaveSlotId(candidate.slotId) &&
    typeof candidate.saveName === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    typeof candidate.players === "object" &&
    typeof candidate.progression === "object" &&
    typeof candidate.world === "object" &&
    typeof candidate.stats === "object"
  );
}

function isSaveSlotId(value: unknown): value is SaveSlotId {
  return value === 1 || value === 2 || value === 3;
}

function getDefaultStorage(): Storage {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  throw new Error("SaveManager requires localStorage or an injected Storage implementation.");
}
