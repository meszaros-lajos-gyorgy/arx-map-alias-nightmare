import { Vector3 } from 'arx-level-generator'
import { randomBetween } from 'arx-level-generator/utils/random'
import { createTerrainProps } from '@/types.js'

export const createIslands = (): createTerrainProps[] => {
  return [
    {
      size: 800,
      position: new Vector3(100, 0, 100),
      angleY: randomBetween(-20, 20),
      type: 'island',
      loot: [],
    },
    {
      size: 500,
      position: new Vector3(0, -100, 1000),
      angleY: randomBetween(-20, 20),
      type: 'island',
      loot: [],
    },
    {
      size: 700,
      position: new Vector3(-1000, -50, 700),
      angleY: randomBetween(-20, 20),
      type: 'island',
      loot: [],
    },
    {
      size: 500,
      position: new Vector3(-30, -70, 3000),
      angleY: randomBetween(-20, 20),
      type: 'island',
      loot: [],
    },
    {
      size: 600,
      position: new Vector3(1800, 300, 1000),
      angleY: randomBetween(-20, 20),
      type: 'island',
      loot: [],
    },
    {
      size: 700,
      position: new Vector3(-2600, 0, 300),
      angleY: randomBetween(-20, 20),
      type: 'island',
      loot: [],
    },
    {
      size: 300,
      position: new Vector3(-270, 300, -1570),
      angleY: randomBetween(-20, 20),
      type: 'island',
      loot: [],
    },
    {
      size: 500,
      position: new Vector3(1400, -150, 2500),
      angleY: randomBetween(-20, 20),
      type: 'island',
      loot: [],
    },
  ]
}