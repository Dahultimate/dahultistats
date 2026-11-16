<script setup lang="ts">
// Circuit de passes sur le terrain de saisie : chaque receveur (« #7 Léa ») à l'endroit de sa réception,
// relié au précédent par une flèche. Positions en fractions de l'écran (0 à 1), déjà orientées.
import { computed } from 'vue'

export interface ScreenStop {
  label: string
  left: number
  top: number
}

/** Repère du dessin : proportions du terrain (100 × 52). */
const WIDTH = 100
const HEIGHT = 52
/** Écart laissé entre la flèche et les pastilles, et taille de la pointe (unités du repère). */
const GAP = 3
const HEAD = 2.6

const props = defineProps<{
  stops: ScreenStop[]
  /** Le dernier joueur du circuit a le disque (attaque en cours). */
  carrierActive: boolean
  /** Endroit déjà touché pour la prochaine passe : flèche en pointillés depuis le porteur. */
  pending: { left: number; top: number } | null
}>()

function arrow(from: { left: number; top: number }, to: { left: number; top: number }) {
  const ax = from.left * WIDTH
  const ay = from.top * HEIGHT
  const dx = to.left * WIDTH - ax
  const dy = to.top * HEIGHT - ay
  const length = Math.hypot(dx, dy)
  if (length < 2 * GAP + HEAD) return null
  const ux = dx / length
  const uy = dy / length
  const tip = { x: ax + dx - ux * GAP, y: ay + dy - uy * GAP }
  const base = { x: tip.x - ux * HEAD, y: tip.y - uy * HEAD }
  const side = { x: -uy * HEAD * 0.6, y: ux * HEAD * 0.6 }
  return {
    line: { x1: ax + ux * GAP, y1: ay + uy * GAP, x2: base.x, y2: base.y },
    head: `${tip.x},${tip.y} ${base.x + side.x},${base.y + side.y} ${base.x - side.x},${base.y - side.y}`,
  }
}

const arrows = computed(() =>
  props.stops.slice(1).flatMap((stop, index) => {
    const drawn = arrow(props.stops[index]!, stop)
    return drawn ? [{ key: index, ...drawn }] : []
  }),
)

const pendingArrow = computed(() => {
  const carrier = props.stops.at(-1)
  return props.carrierActive && carrier && props.pending ? arrow(carrier, props.pending) : null
})
</script>

<template>
  <svg class="arrows" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" aria-hidden="true">
    <g v-for="item in arrows" :key="item.key" class="pass">
      <line v-bind="item.line" />
      <polygon :points="item.head" />
    </g>
    <g v-if="pendingArrow" class="pass pending">
      <line v-bind="pendingArrow.line" />
      <polygon :points="pendingArrow.head" />
    </g>
  </svg>
  <span
    v-for="(stop, index) in stops"
    :key="index"
    class="stop"
    :class="{ carrier: carrierActive && index === stops.length - 1 }"
    :style="{ left: `${stop.left * 100}%`, top: `${stop.top * 100}%` }"
    aria-hidden="true"
  >
    <span class="dot"></span>
    <span class="name">{{ stop.label }}</span>
  </span>
</template>

<style scoped>
.arrows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.pass line {
  stroke: #fff;
  stroke-width: 0.7;
}

.pass polygon {
  fill: #fff;
}

.pending line {
  stroke: var(--accent);
  stroke-dasharray: 1.6 1.2;
}

.pending polygon {
  fill: var(--accent);
}

.stop {
  position: absolute;
  z-index: 3;
  transform: translate(-50%, -50%);
  display: grid;
  justify-items: center;
  pointer-events: none;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #111;
}

.carrier .dot {
  width: 18px;
  height: 18px;
  background: var(--accent);
}

.name {
  position: absolute;
  top: calc(100% + 1px);
  padding: 0 4px;
  border-radius: 4px;
  background: rgb(0 0 0 / 65%);
  color: #fff;
  font: 700 0.75rem var(--font-text);
  white-space: nowrap;
}

.carrier .name {
  background: #111;
  font-size: 0.85rem;
}
</style>
