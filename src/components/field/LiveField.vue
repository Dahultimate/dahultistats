<script setup lang="ts">
// Terrain horizontal de saisie, vu depuis la ligne de touche : on touche l'endroit exact de l'action.
// Les positions sont enregistrées dans le sens de notre attaque ; le sens affiché ne change que le dessin.
import { computed, ref, useId } from 'vue'

import type { FieldPosition } from '@/domain/types'
import { positionName } from '@/domain/zones'
import { fr } from '@/i18n/fr'

import FieldEndzone from './FieldEndzone.vue'
import PassTrail from './PassTrail.vue'

/** Déplacement du repère au clavier, en fraction du terrain. */
const KEY_STEP = 0.04
const ARROW_KEYS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
}

const props = defineProps<{
  attackRight: boolean
  ourName: string
  theirName: string
  /** Endroit choisi (marqué en jaune), pas encore enregistré. */
  selected: FieldPosition | null
  /** Circuit de passes de la possession : receveurs et endroits de réception. */
  trail: { label: string; position: FieldPosition }[]
  /** Le dernier joueur du circuit a le disque. */
  carrierActive: boolean
  disabled: boolean
  /** En attaque, l'en-but adverse est hachuré pour rappeler la cible. */
  attacking: boolean
}>()
const emit = defineEmits<{ select: [position: FieldPosition] }>()

const helpId = useId()
const cursor = ref<FieldPosition>({ x: 0.5, y: 0.5 })
const usingKeyboard = ref(false)

/** Vers la gauche, l'écran est le terrain tourné de 180° (la transformation est son propre inverse). */
function toScreen(position: FieldPosition): FieldPosition {
  return props.attackRight ? position : { x: 1 - position.x, y: 1 - position.y }
}

function clampRound(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 1000) / 1000
}

function onClick(event: MouseEvent): void {
  // Entrée ou Espace au clavier : clic sans coordonnées, on valide le repère.
  if (event.detail === 0) return emit('select', cursor.value)
  usingKeyboard.value = false
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const screen = {
    x: clampRound((event.clientX - box.left) / box.width),
    y: clampRound((event.clientY - box.top) / box.height),
  }
  emit('select', toScreen(screen))
}

function onKeydown(event: KeyboardEvent): void {
  const move = ARROW_KEYS[event.key]
  if (!move) return
  event.preventDefault()
  usingKeyboard.value = true
  const screen = toScreen(cursor.value)
  cursor.value = toScreen({
    x: clampRound(screen.x + move[0] * KEY_STEP),
    y: clampRound(screen.y + move[1] * KEY_STEP),
  })
}

function placed(position: FieldPosition) {
  const screen = toScreen(position)
  return { left: screen.x, top: screen.y }
}

const stops = computed(() =>
  props.trail.map((stop) => ({ label: stop.label, ...placed(stop.position) })),
)
const marker = computed(() => (props.selected ? placed(props.selected) : null))
const cursorMarker = computed(() => (usingKeyboard.value ? placed(cursor.value) : null))
const ariaLabel = computed(() => {
  const where = props.selected ? fr.field.selected(positionName(props.selected)) : ''
  const pointer = usingKeyboard.value ? positionName(cursor.value) : ''
  return [fr.field.label, where, pointer].filter(Boolean).join('. ')
})
const percent = (value: number) => `${value * 100}%`
</script>

<template>
  <div class="live-field" :class="{ disabled }">
    <p class="attack-arrow" aria-hidden="true">
      {{ attackRight ? fr.field.attackArrow : fr.field.attackArrowLeft }}
    </p>
    <button
      type="button"
      class="pitch"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :aria-describedby="helpId"
      @click="onClick"
      @keydown="onKeydown"
      @blur="usingKeyboard = false"
    >
      <FieldEndzone
        side="left"
        :team="attackRight ? ourName : theirName"
        :ours="attackRight"
        :target="attacking && !attackRight"
      />
      <FieldEndzone
        side="right"
        :team="attackRight ? theirName : ourName"
        :ours="!attackRight"
        :target="attacking && attackRight"
      />
      <PassTrail :stops="stops" :carrier-active="carrierActive" :pending="marker" />
      <span
        v-if="marker"
        class="marker"
        :style="{ left: percent(marker.left), top: percent(marker.top) }"
      ></span>
      <span
        v-if="cursorMarker"
        class="marker cursor"
        :style="{ left: percent(cursorMarker.left), top: percent(cursorMarker.top) }"
      ></span>
    </button>
    <p :id="helpId" class="visually-hidden">{{ fr.field.keyboardHelp }}</p>
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
  display: block;
  width: 100%;
  aspect-ratio: 100 / 52;
  min-height: 150px;
  padding: 0;
  border: 3px solid var(--field-line);
  border-radius: 6px;
  background: var(--field);
  cursor: crosshair;
  touch-action: manipulation;
}

.pitch:disabled {
  cursor: default;
}

.disabled .pitch {
  opacity: var(--field-disabled-opacity);
}

.marker {
  position: absolute;
  z-index: 4;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: var(--accent);
  border: 3px solid var(--accent-ink);
  pointer-events: none;
}

.marker.cursor {
  background: transparent;
  border: 3px dashed #fff;
}
</style>
