class AudioService {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Check for window to ensure it runs only in the browser
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else {
      console.warn("Web Audio API is not supported in this browser.");
    }
  }

  private playSound(type: OscillatorType, frequency: number, duration: number, volume: number = 0.5) {
    if (!this.audioContext || this.audioContext.state === 'suspended') {
      this.audioContext?.resume();
    }
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    // Fade out to prevent clicking sound
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Plays a short, high-pitched "blip" sound.
   * Ideal for confirming an action on an already selected item.
   */
  public playConfirmationSound() {
    this.playSound('sine', 880, 0.1, 0.3); // High A note (A5)
    setTimeout(() => this.playSound('sine', 1046.50, 0.1, 0.2), 50); // Higher C note (C6)
  }

  /**
   * Plays a slightly more melodic "ping" sound.
   * Ideal for highlighting a new item or focus.
   */
  public playHighlightSound() {
    this.playSound('triangle', 523.25, 0.2, 0.4); // C5
    setTimeout(() => this.playSound('triangle', 783.99, 0.3, 0.2), 100); // G5
  }
}

// Export a singleton instance
export const audioService = new AudioService();
