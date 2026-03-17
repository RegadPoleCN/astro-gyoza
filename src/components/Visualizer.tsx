import { useEffect, useRef, useState } from 'react'
import { useAtomValue } from 'jotai'
import { themeAtom } from '@/store/theme'
import { getSystemTheme } from '@/utils/theme'

interface VisualizerProps {
  audioElement?: HTMLAudioElement
  enabled?: boolean
}

export function Visualizer({ audioElement, enabled = true }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const theme = useAtomValue(themeAtom)
  const [isEnabled, setIsEnabled] = useState(enabled)

  useEffect(() => {
    if (!audioElement) return

    const initAudio = () => {
      try {
        if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext
          audioContextRef.current = new AudioContext()
        }

        const audioContext = audioContextRef.current
        if (audioContext.state === 'suspended') {
          audioContext.resume()
        }

        if (!sourceRef.current) {
          const analyser = audioContext.createAnalyser()
          analyser.fftSize = 128  // 降低 FFT 大小以提升性能
          analyser.smoothingTimeConstant = 0.85  // 保持平滑度

          const source = audioContext.createMediaElementSource(audioElement)
          source.connect(analyser)
          analyser.connect(audioContext.destination)

          analyserRef.current = analyser
          sourceRef.current = source
        }
      } catch (error) {
        console.error('Audio context initialization failed:', error)
      }
    }

    audioElement.addEventListener('play', initAudio)
    audioElement.addEventListener('playing', initAudio)
    initAudio()

    return () => {
      audioElement.removeEventListener('play', initAudio)
      audioElement.removeEventListener('playing', initAudio)
    }
  }, [audioElement])

  useEffect(() => {
    if (!isEnabled || !canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark')
    const baseColor = isDark ? { r: 153, g: 216, b: 207 } : { r: 245, g: 85, b: 85 } // #99D8CF or #F55555

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      // 清除画布
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = canvas.width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height
        
        // 创建渐变色
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
        
        // 根据频率调整颜色亮度
        const brightness = 0.6 + (dataArray[i] / 255) * 0.4
        gradient.addColorStop(0, `rgb(${Math.floor(baseColor.r * brightness)}, ${Math.floor(baseColor.g * brightness)}, ${Math.floor(baseColor.b * brightness)})`)
        gradient.addColorStop(1, `rgb(${Math.floor(baseColor.r * 0.5)}, ${Math.floor(baseColor.g * 0.5)}, ${Math.floor(baseColor.b * 0.5)})`)
        
        ctx.fillStyle = gradient
        ctx.globalAlpha = 0.9
        
        // 绘制圆角条形
        const radius = Math.min(barWidth / 2 - 1, 4)
        ctx.beginPath()
        ctx.moveTo(x + radius, canvas.height - barHeight)
        ctx.lineTo(x + barWidth - radius, canvas.height - barHeight)
        ctx.quadraticCurveTo(x + barWidth, canvas.height - barHeight, x + barWidth, canvas.height - barHeight + radius)
        ctx.lineTo(x + barWidth, canvas.height)
        ctx.lineTo(x, canvas.height)
        ctx.lineTo(x, canvas.height - barHeight + radius)
        ctx.quadraticCurveTo(x, canvas.height - barHeight, x + radius, canvas.height - barHeight)
        ctx.closePath()
        ctx.fill()

        x += barWidth + 1
      }

      ctx.globalAlpha = 1
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isEnabled, theme])

  return (
    <div className="visualizer-container">
      <canvas
        ref={canvasRef}
        width={280}
        height={50}
        className={`visualizer-canvas ${isEnabled ? 'visible' : 'hidden'}`}
      />
      <button
        className="visualizer-toggle"
        onClick={() => setIsEnabled(!isEnabled)}
        title={isEnabled ? '隐藏波纹' : '显示波纹'}
      >
        {isEnabled ? '⏸' : '▶'}
      </button>
    </div>
  )
}
