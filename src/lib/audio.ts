/**
 * Audio system for Yo-Yo test cues
 */

export type AudioCueType = 'start' | 'turn' | 'level_complete' | 'recovery_start' | 'recovery_end'

export class AudioManager {
  private audioContext: AudioContext | null = null
  private audioFiles: Map<AudioCueType, AudioBuffer> = new Map()
  private isInitialized = false

  constructor() {
    this.initializeAudio()
  }

  private async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      await this.loadAudioFiles()
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }

  private async loadAudioFiles() {
    const audioFiles: Record<AudioCueType, string> = {
      start: '/audio/start_beep.mp3',
      turn: '/audio/turn_beep.mp3',
      level_complete: '/audio/level_complete.mp3',
      recovery_start: '/audio/recovery_start.mp3',
      recovery_end: '/audio/recovery_end.mp3'
    }

    for (const [type, url] of Object.entries(audioFiles)) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
          this.audioFiles.set(type as AudioCueType, audioBuffer)
        }
      } catch (error) {
        console.warn(`Failed to load audio file ${url}:`, error)
        // Create a simple beep as fallback
        this.audioFiles.set(type as AudioCueType, this.createBeep())
      }
    }
  }

  private createBeep(frequency: number = 800, duration: number = 0.2): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized')
    
    const sampleRate = this.audioContext.sampleRate
    const numSamples = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < numSamples; i++) {
      channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3
    }

    return buffer
  }

  async playSound(type: AudioCueType): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      console.warn('Audio not initialized')
      return
    }

    // Resume audio context if it's suspended (required for auto-play policies)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    const audioBuffer = this.audioFiles.get(type)
    if (!audioBuffer) {
      console.warn(`Audio file not found for type: ${type}`)
      return
    }

    const source = this.audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.audioContext.destination)
    source.start()
  }

  async ensureAudioReady(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAudio()
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.audioFiles.clear()
    this.isInitialized = false
  }
}

// Global audio manager instance
export const audioManager = new AudioManager()