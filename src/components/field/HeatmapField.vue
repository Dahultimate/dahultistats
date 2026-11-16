<script setup lang="ts">
// Carte de chaleur : terrain vertical (notre attaque vers le haut), densité des actions
// à partir de leurs positions. Rampe à une teinte en 7 paliers ; les endroits sans action restent gris.
import { computed, useId } from 'vue'

import { densestPosition, densityGrid } from '@/domain/heatmap'
import type { FieldPosition } from '@/domain/types'
import { ENDZONE_DEPTH, positionName } from '@/domain/zones'
import { fr } from '@/i18n/fr'

const RAMPS = {
  blue: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'],
  orange: ['#fde4d8', '#f9c4ab', '#f4a07d', '#eb6834', '#c9521f', '#a24118', '#7c3112'],
} as const
const WIDTHS = { normal: 230, compact: 140, mini: 100 } as const
/** Grille de calcul : 20 cellules dans la largeur, 38 dans la longueur (cellules presque carrées). */
const COLUMNS = 20
const ROWS = 38
/** En dessous de cette part du maximum, la densité n'est pas dessinée (bruit des queues de noyau). */
const MIN_SHARE = 0.08
/** Lignes de but : gris neutre lisible en thème clair comme sombre. */
const GOAL_LINE_COLOR = '#8a96a0'
/** Dessin dans un repère de 52 × 100 (proportions du terrain). */
const WIDTH = 52
const HEIGHT = 100

const props = withDefaults(
  defineProps<{
    positions: readonly FieldPosition[]
    label: string
    ramp?: keyof typeof RAMPS
    size?: keyof typeof WIDTHS
  }>(),
  { ramp: 'blue', size: 'normal' },
)

const blurId = useId()
const grid = computed(() => densityGrid(props.positions, COLUMNS, ROWS))

const cells = computed(() => {
  const { values, max } = grid.value
  return values.flatMap((value, index) => {
    if (max === 0 || value < max * MIN_SHARE) return []
    const level = Math.min(6, Math.ceil((value / max) * 7) - 1)
    const row = Math.floor(index / COLUMNS)
    return [
      {
        key: index,
        x: (index % COLUMNS) * (WIDTH / COLUMNS),
        // En haut de la carte : l'en-but adverse (fin de la longueur).
        y: (ROWS - 1 - row) * (HEIGHT / ROWS),
        fill: RAMPS[props.ramp][level],
      },
    ]
  })
})

const description = computed(() =>
  fr.heatmap.describe(
    props.label,
    props.positions.length,
    positionName(densestPosition(grid.value)),
  ),
)
</script>

<template>
  <figure class="heatmap" :style="{ width: `${WIDTHS[size]}px` }">
    <figcaption v-if="size !== 'mini'" class="legend small">{{ fr.heatmap.top }}</figcaption>
    <!-- Fond et contour en HTML, couleurs du SVG en attributs : l'export PDF / image ne reprend pas
         les styles CSS appliqués à l'intérieur d'un SVG. -->
    <div class="pitch" role="img" :aria-label="description" :title="description">
      <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" aria-hidden="true">
        <!-- Léger flou : adoucit les marches de la grille sans changer la rampe de couleurs. -->
        <filter :id="blurId"><feGaussianBlur stdDeviation="1" /></filter>
        <g :filter="`url(#${blurId})`">
          <rect
            v-for="cell in cells"
            :key="cell.key"
            :x="cell.x"
            :y="cell.y"
            :width="WIDTH / COLUMNS + 0.05"
            :height="HEIGHT / ROWS + 0.05"
            :fill="cell.fill"
          />
        </g>
        <line
          v-for="y in [ENDZONE_DEPTH * HEIGHT, (1 - ENDZONE_DEPTH) * HEIGHT]"
          :key="y"
          x1="0"
          :x2="WIDTH"
          :y1="y"
          :y2="y"
          :stroke="GOAL_LINE_COLOR"
          stroke-width="0.6"
        />
      </svg>
    </div>
    <p v-if="size !== 'mini'" class="legend small">{{ fr.heatmap.bottom }}</p>
    <p class="scale small">
      <template v-if="positions.length > 0">
        <span aria-hidden="true">{{ fr.heatmap.few }}</span>
        <span class="ramp" aria-hidden="true">
          <span v-for="color in RAMPS[ramp]" :key="color" :style="{ background: color }"></span>
        </span>
        <span aria-hidden="true">{{ fr.heatmap.many }}</span>
      </template>
      <span class="total">{{ fr.heatmap.total(positions.length) }}</span>
    </p>
  </figure>
</template>

<style scoped>
.heatmap {
  margin: 0;
  display: grid;
  gap: var(--space-1);
  max-width: 100%;
}

.pitch {
  aspect-ratio: 52 / 100;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--heat-zero);
}

.pitch svg {
  display: block;
  width: 100%;
  height: 100%;
}

.legend {
  margin: 0;
  text-align: center;
  color: var(--ink-muted);
}

.scale {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  color: var(--ink-muted);
}

.ramp {
  flex: 1;
  min-width: 40px;
  display: flex;
  height: 8px;
}

.ramp span {
  flex: 1;
}

.total {
  flex-basis: 100%;
}
</style>
