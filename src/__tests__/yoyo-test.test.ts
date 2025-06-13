import { describe, it, expect } from 'vitest'
import { 
  getTestStateAtTime, 
  calculateVO2Max, 
  getShuttleTime, 
  getAudioCues,
  YOYO_LEVELS,
  RECOVERY_TIME,
  SHUTTLE_DISTANCE 
} from '../lib/yoyo-test'

describe('Yo-Yo Test Core Logic', () => {
  describe('getTestStateAtTime', () => {
    it('should return correct initial state at time zero', () => {
      const state = getTestStateAtTime(0)
      
      expect(state.level).toBe(1)
      expect(state.shuttle).toBe(0)
      expect(state.distance).toBe(0)
      expect(state.totalTime).toBe(0)
      expect(state.isRecoveryPhase).toBe(false)
    })

    it('should calculate correct state during first level', () => {
      // First level: 7.2 seconds per shuttle, 8 shuttles
      const state = getTestStateAtTime(14.4) // 2 shuttles completed
      
      expect(state.level).toBe(1)
      expect(state.shuttle).toBe(2)
      expect(state.distance).toBe(40) // 2 * 20m
      expect(state.totalTime).toBe(14.4)
      expect(state.isRecoveryPhase).toBe(false)
    })

    it('should detect recovery phase correctly', () => {
      // First level completes at 57.6 seconds (8 * 7.2)
      // Recovery phase should be from 57.6 to 67.6
      const state = getTestStateAtTime(60)
      
      expect(state.level).toBe(1)
      expect(state.shuttle).toBe(8)
      expect(state.distance).toBe(160) // 8 * 20m
      expect(state.isRecoveryPhase).toBe(true)
    })

    it('should transition to second level after recovery', () => {
      // First level: 57.6s + recovery 10s = 67.6s start of level 2
      const state = getTestStateAtTime(70) // Just into level 2
      
      expect(state.level).toBe(2)
      expect(state.shuttle).toBe(0) // Just started level 2
      expect(state.distance).toBe(160) // Previous level distance
      expect(state.isRecoveryPhase).toBe(false)
    })

    it('should handle multiple levels correctly', () => {
      // Calculate time for several levels manually
      let totalTime = 0
      let totalDistance = 0
      
      // Level 1: 8 * 7.2 = 57.6s + 10s recovery = 67.6s
      totalTime += YOYO_LEVELS[0].shuttlesPerLevel * YOYO_LEVELS[0].shuttleTime + RECOVERY_TIME
      totalDistance += YOYO_LEVELS[0].shuttlesPerLevel * SHUTTLE_DISTANCE
      
      // Level 2: 8 * 6.55 = 52.4s + 10s recovery = 62.4s
      totalTime += YOYO_LEVELS[1].shuttlesPerLevel * YOYO_LEVELS[1].shuttleTime + RECOVERY_TIME
      totalDistance += YOYO_LEVELS[1].shuttlesPerLevel * SHUTTLE_DISTANCE
      
      // Test during level 3
      const testTime = totalTime + 10 // 10 seconds into level 3
      const state = getTestStateAtTime(testTime)
      
      expect(state.level).toBe(3)
      expect(state.isRecoveryPhase).toBe(false)
      expect(state.distance).toBeGreaterThan(totalDistance)
    })
  })

  describe('calculateVO2Max', () => {
    it('should calculate VO2 max correctly for known distances', () => {
      // Formula: VO2 max = Distance × 0.0084 + 36.4
      
      expect(calculateVO2Max(0)).toBe(36.4)
      expect(calculateVO2Max(100)).toBe(37.24) // 100 * 0.0084 + 36.4 = 37.24
      expect(calculateVO2Max(500)).toBe(40.6) // 500 * 0.0084 + 36.4 = 40.6
      expect(calculateVO2Max(1000)).toBe(44.8) // 1000 * 0.0084 + 36.4 = 44.8
    })

    it('should round to 2 decimal places', () => {
      const result = calculateVO2Max(123) // 123 * 0.0084 + 36.4 = 37.4332
      expect(result).toBe(37.43)
    })
  })

  describe('getShuttleTime', () => {
    it('should return correct time for first level shuttles', () => {
      expect(getShuttleTime(1, 0)).toBe(0)
      expect(getShuttleTime(1, 1)).toBe(7.2)
      expect(getShuttleTime(1, 4)).toBe(28.8) // 4 * 7.2
    })

    it('should account for recovery time between levels', () => {
      // Level 1 complete: 57.6s, recovery: 10s, level 2 start: 67.6s
      const level2Start = YOYO_LEVELS[0].shuttlesPerLevel * YOYO_LEVELS[0].shuttleTime + RECOVERY_TIME
      expect(getShuttleTime(2, 0)).toBe(level2Start)
      expect(getShuttleTime(2, 1)).toBe(level2Start + YOYO_LEVELS[1].shuttleTime)
    })
  })

  describe('getAudioCues', () => {
    it('should generate start cue at time zero', () => {
      const cues = getAudioCues(60)
      
      expect(cues[0]).toEqual({
        time: 0,
        type: 'start'
      })
    })

    it('should generate turn cues for shuttles', () => {
      const cues = getAudioCues(120)
      
      // First turn cue should be at 7.2 seconds (first shuttle completion)
      const firstTurn = cues.find(cue => cue.type === 'turn' && cue.time === 7.2)
      expect(firstTurn).toBeDefined()
      expect(firstTurn?.level).toBe(1)
      expect(firstTurn?.shuttle).toBe(1)
    })

    it('should generate level completion and recovery cues', () => {
      const cues = getAudioCues(120)
      
      // Level 1 completes at 57.6 seconds
      const levelComplete = cues.find(cue => cue.type === 'level_complete')
      expect(levelComplete).toBeDefined()
      expect(levelComplete?.time).toBe(57.6)
      
      const recoveryStart = cues.find(cue => cue.type === 'recovery_start')
      expect(recoveryStart).toBeDefined()
      expect(recoveryStart?.time).toBe(57.7) // 57.6 + 0.1
      
      const recoveryEnd = cues.find(cue => cue.type === 'recovery_end')
      expect(recoveryEnd).toBeDefined()
      expect(recoveryEnd?.time).toBe(67.6) // 57.6 + 10
    })

    it('should respect maximum duration', () => {
      const cues = getAudioCues(30) // Short duration
      
      // Should not have cues beyond 30 seconds
      const lateCues = cues.filter(cue => cue.time > 30)
      expect(lateCues).toHaveLength(0)
    })
  })

  describe('YOYO_LEVELS configuration', () => {
    it('should have correct number of levels', () => {
      expect(YOYO_LEVELS).toHaveLength(20)
    })

    it('should have increasing speeds', () => {
      for (let i = 1; i < YOYO_LEVELS.length; i++) {
        expect(YOYO_LEVELS[i].speed).toBeGreaterThanOrEqual(YOYO_LEVELS[i - 1].speed)
      }
    })

    it('should have consistent shuttle counts', () => {
      YOYO_LEVELS.forEach(level => {
        expect(level.shuttlesPerLevel).toBe(8)
      })
    })

    it('should have decreasing shuttle times (increasing difficulty)', () => {
      for (let i = 1; i < YOYO_LEVELS.length; i++) {
        expect(YOYO_LEVELS[i].shuttleTime).toBeLessThanOrEqual(YOYO_LEVELS[i - 1].shuttleTime)
      }
    })
  })

  describe('Constants', () => {
    it('should have correct constant values', () => {
      expect(RECOVERY_TIME).toBe(10)
      expect(SHUTTLE_DISTANCE).toBe(20)
    })
  })
})