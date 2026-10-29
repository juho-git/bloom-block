import Phaser from 'phaser';
import { LOGICAL_W } from '../config/layout';
import { refreshAudioFromSettings } from '../services/audio';
import { getLang, setLang, t } from '../services/i18n';
import { loadSave, updateSave } from '../services/save';
import { makeButton } from '../ui/Button';
import { FONT, UI } from '../ui/theme';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI.cream);
    this.add.text(LOGICAL_W / 2, 80, t('settings.title'), FONT.h1).setOrigin(0.5);
    makeButton(this, 100, 80, 140, 64, t('settings.back'), () => this.scene.start('Home'), {
      color: 0xbcaaa4,
      fontSize: '20px',
    });

    const save = loadSave();
    this.toggleRow(220, t('settings.sfx'), save.settings.sfx, (v) => {
      updateSave((s) => {
        s.settings.sfx = v;
      });
    });
    this.toggleRow(340, t('settings.bgm'), save.settings.bgm, (v) => {
      updateSave((s) => {
        s.settings.bgm = v;
      });
      refreshAudioFromSettings();
    });
    this.toggleRow(460, t('settings.vibrate'), save.settings.vibrate, (v) => {
      updateSave((s) => {
        s.settings.vibrate = v;
      });
    });

    this.add.text(80, 580, t('settings.lang'), FONT.h2);
    makeButton(this, 220, 660, 160, 80, '한국어', () => {
      setLang('ko');
      this.scene.restart();
    }, { color: getLang() === 'ko' ? UI.button : 0xbcaaa4 });
    makeButton(this, 420, 660, 160, 80, 'English', () => {
      setLang('en');
      this.scene.restart();
    }, { color: getLang() === 'en' ? UI.button : 0xbcaaa4 });
  }

  private toggleRow(
    y: number,
    label: string,
    value: boolean,
    onChange: (v: boolean) => void,
  ): void {
    this.add.text(80, y, label, FONT.h2);
    let current = value;
    const btn = makeButton(this, 520, y + 20, 160, 72, current ? 'ON' : 'OFF', () => {
      current = !current;
      onChange(current);
      this.scene.restart();
    }, { color: current ? UI.button : 0xbcaaa4 });
    void btn;
  }
}
