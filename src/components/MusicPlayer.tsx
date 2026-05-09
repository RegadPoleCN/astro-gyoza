import { useEffect, useMemo, useRef, useState } from 'react'
import { useAtomValue } from 'jotai'

import APlayer from 'APlayer'
import qs from 'qs'
import { player as playerConfig } from '@/config.json'
import { themeAtom } from '@/store/theme'
import { getSystemTheme } from '@/utils/theme'

interface AudioType {
  name: string
  artist: string
  url: string
  cover: string
  lrc: string
}

interface LyricLine {
  time: number
  text: string
}

interface LyricsPosition {
  x: number
  y: number
}

let playerInstance: any = null

export default function MusicPlayer() {
  const theme = useAtomValue(themeAtom)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioListRef = useRef<AudioType[]>([])

  const [isExpanded, setIsExpanded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentAudio, setCurrentAudio] = useState<AudioType | null>(null)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [audioList, setAudioList] = useState<AudioType[]>([])
  const [showVisualizer, setShowVisualizer] = useState(true)
  const [showLyrics, setShowLyrics] = useState(true)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [renderKey, setRenderKey] = useState(0)

  const [lyricsPosition, setLyricsPosition] = useState<LyricsPosition>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const [lyricsSettings, setLyricsSettings] = useState<{ fontSize: number; color: string }>({
    fontSize: 28,
    color: '#ffffff',
  })

  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    initPlayer()
    return () => {
      if (playerInstance) {
        playerInstance.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (playerInstance) {
      const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark')
      const themeColor = isDark ? '#99D8CF' : '#F55555'
      playerInstance.theme(themeColor)
    }
  }, [theme])

  useEffect(() => {
    const audio = document.querySelector('audio') as HTMLAudioElement
    if (audio) {
      audioRef.current = audio
    }
  }, [])

  useEffect(() => {
    audioListRef.current = audioList
  }, [audioList])

  const initPlayer = async () => {
    try {
      const data = await fetchMusicData()
      setAudioList(data)
      audioListRef.current = data

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      const themeColor = isDark ? '#99D8CF' : '#F55555'

      const container = document.getElementById('aplayer')
      if (!container) return

      playerInstance = new APlayer({
        element: container,
        autoplay: false,
        theme: themeColor,
        loop: 'all',
        fixed: false,
        mini: false,
        lrcType: 3,
        preload: 'none',
        audio: data.map((el: AudioType) => ({
          lrc: el.lrc,
          name: el.name,
          artist: el.artist,
          url: el.url,
          cover: el.cover,
        })),
      })

      bindEvents()

      if (data.length > 0) {
        const firstSong = { ...data[0] }
        setCurrentAudio(firstSong)
        setCurrentIndex(0)
        await parseLyrics(data[0].lrc)
        setRenderKey((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Failed to initialize player:', error)
    }
  }

  const fetchMusicData = async (): Promise<AudioType[]> => {
    const params = {
      server: playerConfig.server,
      type: playerConfig.type,
      id: playerConfig.id,
      r: Math.random(),
    }

    let url = playerConfig.api || 'https://api.i-meto.com/meting/api'
    url += '?' + qs.stringify(params, { strictNullHandling: true })

    const res = await fetch(url)
    const data = await res.json()

    return data.map((el: any) => ({
      lrc: el.lrc || '',
      name: el.title,
      artist: el.author,
      url: el.url,
      cover: el.pic,
    }))
  }

  const bindEvents = () => {
    if (!playerInstance) return

    const audio = playerInstance.audio

    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime)
    })
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
    })

    const handleSongSwitch = async () => {
      if (!playerInstance) return

      const index = playerInstance.index
      const songData = audioListRef.current[index]

      if (!songData) {
        console.error('[MusicPlayer] No song data found at index:', index)
        return
      }

      setCurrentTime(0)
      setCurrentIndex(index)
      setCurrentAudio({ ...songData })
      await parseLyrics(songData.lrc)
      setRenderKey((prev) => prev + 1)
    }

    audio.addEventListener('switchaudio', handleSongSwitch)
  }

  // 验证和修复歌词格式 - 处理多个时间戳在同一行的情况
  const validateAndFixLyrics = (lrcString: string): string => {
    if (!lrcString || lrcString.trim() === '') return ''

    const timestampRegex = /\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\]/g
    const matches = Array.from(lrcString.matchAll(timestampRegex))

    if (matches.length === 0) return lrcString

    let fixed = ''
    matches.forEach((match, idx) => {
      const timestamp = match[0]
      const nextMatch = matches[idx + 1]
      const startPos = match.index! + timestamp.length
      const endPos = nextMatch ? nextMatch.index : lrcString.length
      const text = lrcString.substring(startPos, endPos).trim()

      if (text) {
        fixed += `${timestamp} ${text}\n`
      } else {
        fixed += `${timestamp}\n`
      }
    })

    return fixed
  }

  const parseLyrics = async (lrcString: string) => {
    if (!lrcString || lrcString.trim() === '') {
      setLyrics([])
      return
    }

    let actualLyrics = lrcString
    if (lrcString.startsWith('http://') || lrcString.startsWith('https://')) {
      try {
        const response = await fetch(lrcString)
        actualLyrics = await response.text()
      } catch (error) {
        console.error('[MusicPlayer] Failed to fetch lyrics from URL:', error)
        setLyrics([])
        return
      }
    }

    const fixedLyrics = validateAndFixLyrics(actualLyrics)
    const lines = fixedLyrics.split('\n').filter((line) => line.trim())

    const parsed = lines
      .map((line: string) => {
        const match = line.match(/^\s*\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\]\s*(.*)/)
        if (match) {
          const minutes = parseInt(match[1], 10)
          const seconds = parseFloat(match[2])
          const time = minutes * 60 + seconds
          const text = match[3].trim()
          return { time, text }
        }
        return null
      })
      .filter(Boolean) as LyricLine[]

    parsed.sort((a, b) => a.time - b.time)
    setLyrics(parsed)
  }

  const togglePlay = () => {
    if (playerInstance) {
      playerInstance.toggle()
    }
  }

  const skipPrev = () => {
    if (!playerInstance || audioList.length === 0) return

    let newIndex = currentIndex - 1
    if (newIndex < 0) {
      newIndex = audioList.length - 1
    }

    selectSong(newIndex)
  }

  const skipNext = () => {
    if (!playerInstance || audioList.length === 0) return

    let newIndex = currentIndex + 1
    if (newIndex >= audioList.length) {
      newIndex = 0
    }

    selectSong(newIndex)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (playerInstance) {
      playerInstance.seek(time)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 使用 useMemo 缓存当前歌词索引计算，避免每次渲染都重新计算
  const currentLyricIndex = useMemo(() => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        return i
      }
    }
    return -1
  }, [lyrics, currentTime])

  const getCurrentAndNextLyric = () => {
    if (lyrics.length === 0 || currentLyricIndex === -1) {
      return { currentLyric: '', nextLyric: '' }
    }

    const currentLyric = lyrics[currentLyricIndex]?.text || ''
    const nextLyric = lyrics[currentLyricIndex + 1]?.text || ''

    return { currentLyric, nextLyric }
  }

  const { currentLyric, nextLyric } = getCurrentAndNextLyric()

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenuPos({ x: e.clientX, y: e.clientY })
    setContextMenuVisible(true)
  }

  useEffect(() => {
    if (!contextMenuVisible) return

    const handleClickOutside = () => {
      setContextMenuVisible(false)
    }

    window.addEventListener('click', handleClickOutside)
    window.addEventListener('contextmenu', handleClickOutside)

    return () => {
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('contextmenu', handleClickOutside)
    }
  }, [contextMenuVisible])

  const updateFontSize = (size: number) => {
    setLyricsSettings((prev) => ({ ...prev, fontSize: Math.max(16, Math.min(64, size)) }))
  }

  const updateColor = (color: string) => {
    setLyricsSettings((prev) => ({ ...prev, color }))
  }

  // 初始化歌词位置和设置（从 localStorage 读取）
  useEffect(() => {
    const savedPosition = localStorage.getItem('lyrics-position')
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition)
        if (pos.x > window.innerWidth) pos.x = window.innerWidth - 400
        if (pos.y > window.innerHeight) pos.y = window.innerHeight - 100
        setLyricsPosition(pos)
      } catch (e) {
        console.error('Failed to load lyrics position:', e)
      }
    } else {
      if (window.innerWidth < 768) {
        setLyricsPosition({ x: 20, y: window.innerHeight - 200 })
      } else {
        setLyricsPosition({ x: window.innerWidth - 400, y: 80 })
      }
    }

    const savedLyricsVisible = localStorage.getItem('lyrics-visible')
    if (savedLyricsVisible !== null) {
      setShowLyrics(savedLyricsVisible === 'true')
    }

    const savedLyricsSettings = localStorage.getItem('lyrics-settings')
    if (savedLyricsSettings) {
      try {
        const settings = JSON.parse(savedLyricsSettings)
        setLyricsSettings({
          fontSize: Math.max(16, Math.min(64, settings.fontSize || 28)),
          color: settings.color || '#ffffff',
        })
      } catch (e) {
        console.error('Failed to load lyrics settings:', e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('lyrics-position', JSON.stringify(lyricsPosition))
  }, [lyricsPosition])

  useEffect(() => {
    localStorage.setItem('lyrics-settings', JSON.stringify(lyricsSettings))
  }, [lyricsSettings])

  // 拖拽功能 - 使用 ref 保存最新的 dragOffset 以避免闭包陷阱
  const dragOffsetRef = useRef(dragOffset)

  useEffect(() => {
    dragOffsetRef.current = dragOffset
  }, [dragOffset])

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    setDragOffset({
      x: clientX - lyricsPosition.x,
      y: clientY - lyricsPosition.y,
    })
  }

  useEffect(() => {
    const onDrag = (e: MouseEvent | TouchEvent) => {
      if (e.type === 'touchmove') {
        e.preventDefault()
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY

      setLyricsPosition({
        x: clientX - dragOffsetRef.current.x,
        y: clientY - dragOffsetRef.current.y,
      })
    }

    const stopDrag = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', onDrag)
      window.addEventListener('mouseup', stopDrag)
      window.addEventListener('touchmove', onDrag, { passive: false })
      window.addEventListener('touchend', stopDrag)
    }

    return () => {
      window.removeEventListener('mousemove', onDrag)
      window.removeEventListener('mouseup', stopDrag)
      window.removeEventListener('touchmove', onDrag)
      window.removeEventListener('touchend', stopDrag)
    }
  }, [isDragging])

  // 自动滚动歌词到当前行
  useEffect(() => {
    if (currentLyricIndex >= 0 && isExpanded && showLyrics) {
      const lyricsContainer = document.querySelector('.lyrics-container')
      const currentLine = document.querySelector('.lyric-line.current')

      if (lyricsContainer && currentLine) {
        const containerHeight = lyricsContainer.clientHeight
        const lineOffset = (currentLine as HTMLElement).offsetTop
        const lineHeight = (currentLine as HTMLElement).clientHeight

        const scrollPosition = lineOffset - containerHeight / 2 + lineHeight / 2

        lyricsContainer.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        })
      }
    }
  }, [currentLyricIndex, isExpanded, showLyrics])

  // 选择歌曲并切换播放
  const selectSong = async (index: number) => {
    if (!playerInstance || !audioList[index]) return

    try {
      const songData = audioList[index]
      setCurrentIndex(index)
      setCurrentAudio({ ...songData })
      await parseLyrics(songData.lrc)
      setRenderKey((prev) => prev + 1)

      playerInstance.switchAudio(index)

      setTimeout(() => {
        if (playerInstance) {
          playerInstance.play()
        }
      }, 50)

      setShowPlaylist(false)
    } catch (error) {
      console.error('[MusicPlayer] Failed to switch song:', error)
    }
  }

  return (
    <>
      {/* 桌面歌词窗口 */}
      {showLyrics && (
        <div
          className="desktop-lyrics-container"
          style={
            {
              top: lyricsPosition.y + 'px',
              left: lyricsPosition.x + 'px',
              '--lyrics-font-size': `${lyricsSettings.fontSize}px`,
              '--lyrics-color': lyricsSettings.color,
            } as React.CSSProperties
          }
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          onContextMenu={handleContextMenu}
        >
          {currentLyric || nextLyric ? (
            <div className="lyrics-wrapper">
              <div key={currentLyric} className="lyric-line current">
                {currentLyric || '...'}
              </div>
              {nextLyric && (
                <div key={nextLyric} className="lyric-line next">
                  {nextLyric}
                </div>
              )}
            </div>
          ) : (
            <div className="lyrics-placeholder">Waiting for lyrics...</div>
          )}

          {/* 右键菜单 */}
          {contextMenuVisible && (
            <div
              className="context-menu"
              style={{ top: contextMenuPos.y + 'px', left: contextMenuPos.x + 'px' }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.stopPropagation()}
            >
              <div className="context-menu-item">
                <label className="context-menu-label">
                  <span>字号: {lyricsSettings.fontSize}px</span>
                  <input
                    type="range"
                    min="16"
                    max="64"
                    value={lyricsSettings.fontSize}
                    onChange={(e) => updateFontSize(parseInt(e.target.value, 10))}
                    className="context-menu-slider"
                  />
                </label>
              </div>
              <div className="context-menu-item">
                <label className="context-menu-label">
                  <span>颜色</span>
                  <input
                    type="color"
                    value={lyricsSettings.color}
                    onChange={(e) => updateColor(e.target.value)}
                    className="context-menu-color-picker"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 迷你模式 - 唱片 */}
      {!isExpanded && (
        <div className="mini-player-wrapper">
          <div
            className={`mini-player ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsExpanded(true)}
          >
            <div
              className="mini-player-cover"
              style={{ backgroundImage: `url(${currentAudio?.cover || ''})` }}
            />
          </div>
        </div>
      )}

      {/* 展开模式 */}
      {isExpanded && (
        <div className="expanded-player" key={`player-${renderKey}`}>
          {/* 背景层和遮罩层 */}
          <div className="player-background-layer">
            <div
              className="player-background"
              style={{ backgroundImage: `url(${currentAudio?.cover || ''})` }}
            />
            <div className="player-overlay" />
          </div>

          {/* 播放列表面板 */}
          <div className={`playlist-panel ${showPlaylist ? 'show' : ''}`}>
            <div className="playlist-header">
              <span className="playlist-title">播放列表 ({audioList.length})</span>
              <button
                className="playlist-close"
                onClick={() => setShowPlaylist(false)}
                title="关闭列表"
              >
                ×
              </button>
            </div>
            <div className="playlist-content">
              {audioList.map((song, index) => (
                <div
                  key={index}
                  className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => selectSong(index)}
                >
                  <div
                    className="playlist-item-cover"
                    style={{ backgroundImage: `url(${song.cover})` }}
                  />
                  <div className="playlist-item-info">
                    <div className="playlist-item-title">{song.name}</div>
                    <div className="playlist-item-artist">{song.artist}</div>
                  </div>
                  {index === currentIndex && <span className="playlist-item-playing">♫</span>}
                </div>
              ))}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="player-content">
            {/* 顶部关闭按钮行 */}
            {!showPlaylist && (
              <div className="player-top-bar">
                <div className="player-top-spacer" />
                <button className="player-close" onClick={() => setIsExpanded(false)} title="关闭">
                  ×
                </button>
              </div>
            )}

            {/* 歌曲信息 */}
            <div className="song-info" key={`song-info-${currentIndex}-${renderKey}`}>
              <div className="song-left">
                <div
                  className="song-cover"
                  style={{ backgroundImage: `url(${currentAudio?.cover || ''})` }}
                  title="点击展开播放列表"
                  onClick={() => setShowPlaylist(true)}
                />
                <div className="song-details">
                  <div className="song-title">{currentAudio?.name || '未知曲目'}</div>
                  <div className="song-artist">{currentAudio?.artist || '未知艺术家'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className="lyrics-toggle-btn"
                  onClick={() => setShowLyrics(!showLyrics)}
                  title={showLyrics ? '隐藏歌词' : '显示歌词'}
                >
                  🎵
                  {!showLyrics && <span className="slash">/</span>}
                </button>
                <button
                  className="playlist-btn"
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  title="播放列表"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 进度条 */}
            <div className="progress-container">
              <div className="progress-bar-wrapper">
                <span className="progress-time">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  className="progress-slider"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                />
                <span className="progress-time">{formatTime(duration)}</span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="controls">
              <button className="control-btn" onClick={skipPrev} title="上一首">
                <svg viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                className="control-btn main"
                onClick={togglePlay}
                title={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button className="control-btn" onClick={skipNext} title="下一首">
                <svg viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>

            {/* Visualizer */}
            <div className={`visualizer-section ${!showVisualizer ? 'hidden' : ''}`}>
              {showVisualizer && audioRef.current && (
                <>
                  <canvas
                    ref={(canvas) => {
                      if (canvas) {
                        canvas.width = 240
                        canvas.height = 35
                      }
                    }}
                    className="visualizer-canvas"
                  />
                  <button
                    className="visualizer-toggle"
                    onClick={() => setShowVisualizer(!showVisualizer)}
                    title={showVisualizer ? '隐藏波纹' : '显示波纹'}
                  >
                    ⏸
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的 APlayer 容器 */}
      <div id="aplayer" style={{ display: 'none' }} />
    </>
  )
}
