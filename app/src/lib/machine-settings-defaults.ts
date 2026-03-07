export type MachineSettingPreset = { key: string; value: string };

const PRESETS: Record<string, string[]> = {
  machine: ['Siege', 'Dossier', 'Limiteur amplitude', 'Pin Poids'],
  cable: ['Hauteur poulie', 'Type poignee', 'Pin Poids'],
  leg_press_machine: ['Position siege', 'Position pieds', 'Securites', 'Pin Poids'],
  hack_squat_machine: ['Epaulieres', 'Position pieds', 'Securites'],
  smith_machine: ['Hauteur barre', 'Position banc', 'Securites'],
  prime: ['Pin Poids 1', 'Pin Poids 2', 'Bras levier', 'Siege', 'Dossier'],
};

export function getDefaultSettings(equipmentList: string[] | null, label: string): MachineSettingPreset[] {
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('prime')) {
    return PRESETS.prime.map(key => ({ key, value: '' }));
  }

  if (equipmentList) {
    for (const eq of equipmentList) {
      const normalized = eq.toLowerCase().replace(/\s+/g, '_');
      if (PRESETS[normalized]) {
        return PRESETS[normalized].map(key => ({ key, value: '' }));
      }
    }
    if (equipmentList.some(e => e.toLowerCase().includes('cable') || e.toLowerCase().includes('poulie'))) {
      return PRESETS.cable.map(key => ({ key, value: '' }));
    }
    if (equipmentList.some(e => e.toLowerCase().includes('machine') || e.toLowerCase().includes('guidee'))) {
      return PRESETS.machine.map(key => ({ key, value: '' }));
    }
  }

  return PRESETS.machine.map(key => ({ key, value: '' }));
}
