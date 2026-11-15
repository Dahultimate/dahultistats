<script setup lang="ts">
// Terrain horizontal de saisie : 15 zones tactiles, vu depuis la ligne de touche.
// Le sens affiché change seulement l'affichage : les zones restent dans le sens de notre attaque.
import { computed } from 'vue'

import type { ZoneId } from '@/domain/types'
import { rankOf, screenGrid, zoneName } from '@/domain/zones'
import { fr } from '@/i18n/fr'

import EndzoneLabel from './EndzoneLabel.vue'

const props = defineProps<{
  attackRight: boolean
  ourName: string
  theirName: string
  selectedZone: ZoneId | null
  carrierZone: ZoneId | null
  carrierNumber: number | null
  disabled: boolean
  /** En attaque, l'en-but adverse est hachuré pour rappeler la cible. */
  attacking: boolean
}>()
const emit = defineEmits<{ select: [zone: ZoneId] }>()

const zones = computed(() => screenGrid(props.attackRight).flat())
const leftIsOurs = computed(() => props.attackRight)

function zoneLabel(zone: ZoneId): string {
  const carrier =
    zone === props.carrierZone && props.carrierNumber !== null
      ? ` · porteur #${props.carrierNumber}`
      : ''
  return `${zoneName(zone)}${carrier}`
}
</script>

<template>
  <div class="live-field" :class="{ disabled }">
    <p class="attack-arrow" aria-hidden="true">
      {{ attackRight ? fr.field.attackArrow : fr.field.attackArrowLeft }}
    </p>
    <div class="pitch" role="group" :aria-label="fr.field.label" :aria-disabled="disabled">
      <button
        v-for="zone in zones"
        :key="zone"
        type="button"
        class="zone"
        :class="{
          endzone: ['D', 'A'].includes(rankOf(zone)),
          target: attacking && rankOf(zone) === 'A',
          selected: zone === selectedZone,
        }"
        :aria-label="zoneLabel(zone)"
        :aria-pressed="zone === selectedZone"
        :disabled="disabled"
        @click="emit('select', zone)"
      >
        <span v-if="zone === carrierZone && carrierNumber !== null" class="disc" aria-hidden="true">
          {{ carrierNumber }}
        </span>
      </button>
      <span class="goal-line goal-line-left" aria-hidden="true"></span>
      <span class="goal-line goal-line-right" aria-hidden="true"></span>
      <EndzoneLabel side="left" :team="leftIsOurs ? ourName : theirName" :ours="leftIsOurs" />
      <EndzoneLabel side="right" :team="leftIsOurs ? theirName : ourName" :ours="!leftIsOurs" />
    </div>
  </div>
</template>

<style scoped>
.live-field {
  display: grid;
  gap: var(--space-1);
}

.attack-arrow {
  margin: 0;
  text-align: center;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 1.1rem;
}

.pitch {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1.2fr 1.2fr 1.2fr 1fr;
  grid-template-rows: repeat(3, minmax(50px, 1fr));
  gap: 1px;
  aspect-ratio: 100 / 52;
  padding: 3px;
  border-radius: 6px;
  background: rgb(255 255 255 / 55%);
}

.zone {
  position: relative;
  border: none;
  margin: 0;
  padding: 0;
  background: var(--field);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.zone.endzone {
  background: var(--field-endzone);
}

.zone.target {
  background: repeating-linear-gradient(
    45deg,
    var(--field-endzone) 0 10px,
    rgb(255 210 63 / 55%) 10px 14px
  );
}

.zone.selected {
  background: var(--accent);
  box-shadow: inset 0 0 0 3px var(--accent-ink);
}

.zone:disabled {
  cursor: default;
}

.disabled .pitch {
  opacity: var(--field-disabled-opacity);
}

.disc {
  position: relative;
  z-index: 2;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #fff;
  color: #111;
  border: 2px solid #111;
  display: grid;
  place-items: center;
  font: 700 1rem var(--font-title);
}

.goal-line {
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: 4px;
  background: var(--field-line);
  pointer-events: none;
}

.goal-line-left {
  left: calc(3px + (100% - 6px) / 5.6 - 2px);
}

.goal-line-right {
  right: calc(3px + (100% - 6px) / 5.6 - 2px);
}
</style>
