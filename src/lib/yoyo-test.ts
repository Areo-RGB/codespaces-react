/**
 * Yo-Yo Intermittent Recovery Test Level 1 Implementation
 * Based on official protocols and calculations
 */

export interface YoYoTestState {
  level: number
  shuttle: number
  distance: number
  totalTime: number
  isRecoveryPhase: boolean
}

export interface LevelConfig {
  level: number
  speed: number // km/h
  shuttlesPerLevel: number
  shuttleTime: number // seconds
}

// Yo-Yo Test Level 1 configuration
export const YOYO_LEVELS: LevelConfig[] = [
  { level: 1, speed: 10, shuttlesPerLevel: 8, shuttleTime: 7.2 },
  { level: 2, speed: 11, shuttlesPerLevel: 8, shuttleTime: 6.55 },
  { level: 3, speed: 12, shuttlesPerLevel: 8, shuttleTime: 6.0 },
  { level: 4, speed: 13, shuttlesPerLevel: 8, shuttleTime: 5.54 },
  { level: 5, speed: 13.5, shuttlesPerLevel: 8, shuttleTime: 5.33 },
  { level: 6, speed: 14, shuttlesPerLevel: 8, shuttleTime: 5.14 },
  { level: 7, speed: 14.5, shuttlesPerLevel: 8, shuttleTime: 4.97 },
  { level: 8, speed: 15, shuttlesPerLevel: 8, shuttleTime: 4.8 },
  { level: 9, speed: 15.5, shuttlesPerLevel: 8, shuttleTime: 4.65 },
  { level: 10, speed: 16, shuttlesPerLevel: 8, shuttleTime: 4.5 },
  { level: 11, speed: 16.5, shuttlesPerLevel: 8, shuttleTime: 4.36 },
  { level: 12, speed: 17, shuttlesPerLevel: 8, shuttleTime: 4.24 },
  { level: 13, speed: 17.5, shuttlesPerLevel: 8, shuttleTime: 4.11 },
  { level: 14, speed: 18, shuttlesPerLevel: 8, shuttleTime: 4.0 },
  { level: 15, speed: 18.5, shuttlesPerLevel: 8, shuttleTime: 3.89 },
  { level: 16, speed: 19, shuttlesPerLevel: 8, shuttleTime: 3.79 },
  { level: 17, speed: 19.5, shuttlesPerLevel: 8, shuttleTime: 3.69 },
  { level: 18, speed: 20, shuttlesPerLevel: 8, shuttleTime: 3.6 },
  { level: 19, speed: 20.5, shuttlesPerLevel: 8, shuttleTime: 3.51 },
  { level: 20, speed: 21, shuttlesPerLevel: 8, shuttleTime: 3.43 },
]

export const RECOVERY_TIME = 10 // seconds between levels
export const SHUTTLE_DISTANCE = 20 // meters

/**
 * Calculate the current test state at a given time
 */
export function getTestStateAtTime(elapsedSeconds: number): YoYoTestState {
  if (elapsedSeconds <= 0) {
    return {
      level: 1,
      shuttle: 0,
      distance: 0,
      totalTime: 0,
      isRecoveryPhase: false
    }
  }

  let totalTime = 0
  let currentLevel = 1
  let currentShuttle = 0
  let totalDistance = 0

  for (const levelConfig of YOYO_LEVELS) {
    const levelStartTime = totalTime
    const shuttleTime = levelConfig.shuttleTime
    const levelDuration = levelConfig.shuttlesPerLevel * shuttleTime

    // Check if we're still in this level
    if (elapsedSeconds <= totalTime + levelDuration) {
      const timeInLevel = elapsedSeconds - totalTime
      const shuttlesCompleted = Math.floor(timeInLevel / shuttleTime)
      const distanceInLevel = shuttlesCompleted * SHUTTLE_DISTANCE

      return {
        level: levelConfig.level,
        shuttle: shuttlesCompleted,
        distance: totalDistance + distanceInLevel,
        totalTime: elapsedSeconds,
        isRecoveryPhase: false
      }
    }

    totalTime += levelDuration
    totalDistance += levelConfig.shuttlesPerLevel * SHUTTLE_DISTANCE
    currentLevel = levelConfig.level

    // Check if we're in recovery phase after this level
    if (elapsedSeconds <= totalTime + RECOVERY_TIME) {
      return {
        level: currentLevel,
        shuttle: levelConfig.shuttlesPerLevel,
        distance: totalDistance,
        totalTime: elapsedSeconds,
        isRecoveryPhase: true
      }
    }

    totalTime += RECOVERY_TIME
  }

  // If we've exceeded all levels, return the final state
  const lastLevel = YOYO_LEVELS[YOYO_LEVELS.length - 1]
  return {
    level: lastLevel.level,
    shuttle: lastLevel.shuttlesPerLevel,
    distance: totalDistance,
    totalTime: elapsedSeconds,
    isRecoveryPhase: false
  }
}

/**
 * Calculate VO2 max based on final distance
 */
export function calculateVO2Max(distanceMeters: number): number {
  // Yo-Yo Test Level 1 VO2 max calculation formula
  // VO2 max (ml/kg/min) = Distance (m) × 0.0084 + 36.4
  const vo2Max = distanceMeters * 0.0084 + 36.4
  return Math.round(vo2Max * 100) / 100 // Round to 2 decimal places
}

/**
 * Get the time when a specific shuttle should occur
 */
export function getShuttleTime(level: number, shuttle: number): number {
  let totalTime = 0

  for (const levelConfig of YOYO_LEVELS) {
    if (levelConfig.level < level) {
      // Add full level time + recovery
      totalTime += levelConfig.shuttlesPerLevel * levelConfig.shuttleTime + RECOVERY_TIME
    } else if (levelConfig.level === level) {
      // Add partial level time
      totalTime += shuttle * levelConfig.shuttleTime
      break
    }
  }

  return totalTime
}

/**
 * Get audio cue timing for beeps
 */
export interface AudioCue {
  time: number
  type: 'start' | 'turn' | 'level_complete' | 'recovery_start' | 'recovery_end'
  level?: number
  shuttle?: number
}

export function getAudioCues(maxDuration: number = 3600): AudioCue[] {
  const cues: AudioCue[] = []
  let totalTime = 0

  // Start beep
  cues.push({ time: 0, type: 'start' })

  for (const levelConfig of YOYO_LEVELS) {
    const levelStartTime = totalTime
    
    // Shuttle turn beeps within the level
    for (let shuttle = 1; shuttle <= levelConfig.shuttlesPerLevel; shuttle++) {
      const shuttleTime = levelStartTime + shuttle * levelConfig.shuttleTime
      if (shuttleTime > maxDuration) return cues
      
      cues.push({
        time: shuttleTime,
        type: 'turn',
        level: levelConfig.level,
        shuttle
      })
    }

    totalTime += levelConfig.shuttlesPerLevel * levelConfig.shuttleTime

    // Level complete beep
    if (totalTime <= maxDuration) {
      cues.push({
        time: totalTime,
        type: 'level_complete',
        level: levelConfig.level
      })
    }

    // Recovery phase
    if (totalTime <= maxDuration) {
      cues.push({
        time: totalTime + 0.1,
        type: 'recovery_start',
        level: levelConfig.level
      })
    }

    totalTime += RECOVERY_TIME

    if (totalTime <= maxDuration) {
      cues.push({
        time: totalTime,
        type: 'recovery_end',
        level: levelConfig.level
      })
    }

    if (totalTime > maxDuration) break
  }

  return cues
}