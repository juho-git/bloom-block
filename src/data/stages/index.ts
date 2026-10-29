import type { StageData } from '../../core/types';
import { validateStageData } from '../../core/goals';

import s001 from './stage-001.json';
import s002 from './stage-002.json';
import s003 from './stage-003.json';
import s004 from './stage-004.json';
import s005 from './stage-005.json';
import s006 from './stage-006.json';
import s007 from './stage-007.json';
import s008 from './stage-008.json';
import s009 from './stage-009.json';
import s010 from './stage-010.json';
import s011 from './stage-011.json';
import s012 from './stage-012.json';
import s013 from './stage-013.json';
import s014 from './stage-014.json';
import s015 from './stage-015.json';
import s016 from './stage-016.json';
import s017 from './stage-017.json';
import s018 from './stage-018.json';
import s019 from './stage-019.json';
import s020 from './stage-020.json';
import s021 from './stage-021.json';
import s022 from './stage-022.json';
import s023 from './stage-023.json';
import s024 from './stage-024.json';
import s025 from './stage-025.json';
import s026 from './stage-026.json';
import s027 from './stage-027.json';
import s028 from './stage-028.json';
import s029 from './stage-029.json';
import s030 from './stage-030.json';

const raw = [
  s001, s002, s003, s004, s005, s006, s007, s008, s009, s010,
  s011, s012, s013, s014, s015, s016, s017, s018, s019, s020,
  s021, s022, s023, s024, s025, s026, s027, s028, s029, s030,
];

let cache: StageData[] | null = null;

export function getAllStages(): StageData[] {
  if (!cache) cache = raw.map((r) => validateStageData(r));
  return cache;
}

export function getStage(id: number): StageData {
  const s = getAllStages().find((x) => x.id === id);
  if (!s) throw new Error(`Stage ${id} not found`);
  return s;
}

export const STAGE_COUNT = 30;
