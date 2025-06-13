import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for tests
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Web Audio API
global.AudioContext = vi.fn().mockImplementation(() => ({
  createBuffer: vi.fn().mockReturnValue({
    getChannelData: vi.fn().mockReturnValue(new Float32Array(1024))
  }),
  createBufferSource: vi.fn().mockReturnValue({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn()
  }),
  decodeAudioData: vi.fn().mockResolvedValue({
    getChannelData: vi.fn().mockReturnValue(new Float32Array(1024))
  }),
  destination: {},
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  state: 'running',
  sampleRate: 44100
}))

// Mock fetch for audio files
global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
})