import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from './config/layout';
import { BootScene } from './scenes/BootScene';
import { HomeScene } from './scenes/HomeScene';
import { StageMapScene } from './scenes/StageMapScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { GardenScene } from './scenes/GardenScene';
import { SettingsScene } from './scenes/SettingsScene';
import { unlockAudio } from './services/audio';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: LOGICAL_W,
  height: LOGICAL_H,
  backgroundColor: '#fff8e1',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, HomeScene, StageMapScene, GameScene, ResultScene, GardenScene, SettingsScene],
  input: {
    activePointers: 1,
  },
  render: {
    antialias: true,
    roundPixels: true,
  },
};

const game = new Phaser.Game(config);

const unlock = () => {
  unlockAudio();
  window.removeEventListener('pointerdown', unlock);
};
window.addEventListener('pointerdown', unlock);

export default game;
