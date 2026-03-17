import { useEffect, useRef, useState } from 'react'
import { useAtomValue } from 'jotai'

import APlayer from 'APlayer'
import qs from 'qs'
import { player as playerConfig } from '@/config.json'
import { themeAtom } from '@/store/theme'
import { getSystemTheme } from '@/utils/theme'


// 类型定义
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

let playerInstance: any = null

export default function MusicPlayer() {
  const theme = useAtomValue(themeAtom)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioListRef = useRef<AudioType[]>([]) // 使用 ref 保持 audioList 稳定性
  
  // 状态管理
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

  // 初始化播放器
  useEffect(() => {
    initPlayer()
    return () => {
      if (playerInstance) {
        playerInstance.destroy()
      }
    }
  }, [])

  // 主题切换
  useEffect(() => {
    if (playerInstance) {
      const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark')
      const themeColor = isDark ? '#99D8CF' : '#F55555'
      playerInstance.theme(themeColor)
    }
  }, [theme])

  // 监听音频元素
  useEffect(() => {
    const audio = document.querySelector('audio') as HTMLAudioElement
    if (audio) {
      audioRef.current = audio
    }
  }, [])

  // 同步 ref 和 state
  useEffect(() => {
    audioListRef.current = audioList
  }, [audioList])

  // 初始化 APlayer
  const initPlayer = async () => {
    try {
      const data = await fetchMusicData()
      setAudioList(data)
      audioListRef.current = data
      
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      const themeColor = isDark ? '#99D8CF' : '#F55555'
      
      // 创建隐藏的 APlayer 容器
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

      // 绑定事件监听
      bindEvents()
      
      // 初始化当前歌曲
      if (data.length > 0) {
        const firstSong = { ...data[0] }
        setCurrentAudio(firstSong)
        setCurrentIndex(0)
        await parseLyrics(data[0].lrc)
        setRenderKey(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to initialize player:', error)
    }
  }

  // 获取音乐数据
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

  // 绑定 APlayer 事件
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
    
    // 监听歌曲切换事件
    const handleSongSwitch = async () => {
      if (!playerInstance) return
      
      const index = playerInstance.index
      const songData = audioListRef.current[index]
      
      if (!songData) {
        console.error('[MusicPlayer] No song data found at index:', index)
        return
      }
      
      console.log('[MusicPlayer] Song switch event triggered:', {
        index,
        name: songData.name,
        artist: songData.artist,
        previousIndex: currentIndex
      })
      
      // 重置时间并更新所有状态
      setCurrentTime(0)
      setCurrentIndex(index)
      setCurrentAudio({ ...songData })
      await parseLyrics(songData.lrc)
      setRenderKey(prev => prev + 1)
    }
    
    audio.addEventListener('switchaudio', handleSongSwitch)
  }

  // 解析歌词
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
    console.log('[MusicPlayer] Raw lyrics:', lrcString ? lrcString.substring(0, 100) + '...' : 'empty')
    console.log('[MusicPlayer] Raw lyrics length:', lrcString?.length || 0)
    
    if (!lrcString || lrcString.trim() === '') {
      console.log('[MusicPlayer] No lyrics provided or empty')
      setLyrics([])
      return
    }
    
    let actualLyrics = lrcString
    if (lrcString.startsWith('http://') || lrcString.startsWith('https://')) {
      console.log('[MusicPlayer] Detected lyrics URL, fetching...')
      try {
        const response = await fetch(lrcString)
        actualLyrics = await response.text()
        console.log('[MusicPlayer] Fetched lyrics:', actualLyrics.substring(0, 100) + '...')
      } catch (error) {
        console.error('[MusicPlayer] Failed to fetch lyrics from URL:', error)
        setLyrics([])
        return
      }
    }
    
    const fixedLyrics = validateAndFixLyrics(actualLyrics)
    console.log('[MusicPlayer] Fixed lyrics:', fixedLyrics.substring(0, 100) + '...')
    const lines = fixedLyrics.split('\n').filter(line => line.trim())
    console.log('[MusicPlayer] Split lines:', lines.length, lines.slice(0, 3))
    
    const parsed = lines
      .map((line: string, lineIndex: number) => {
        // 改进的正则表达式，支持时间戳前的空格和多种时间格式
        const match = line.match(/^\s*\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\]\s*(.*)/)
        if (match) {
          const minutes = parseInt(match[1], 10)
          const seconds = parseFloat(match[2])
          const time = minutes * 60 + seconds
          const text = match[3].trim()
          console.log(`[MusicPlayer] Line ${lineIndex}: [${match[1]}:${match[2]}] "${text}" -> ${time}s`)
          return { time, text }
        } else {
          console.log(`[MusicPlayer] Line ${lineIndex}: No match - "${line.substring(0, 50)}"`)
          return null
        }
      })
      .filter(Boolean) as LyricLine[]
    
    parsed.sort((a, b) => a.time - b.time)
    
    console.log('[MusicPlayer] Parsed lyrics:', parsed.length, 'lines', parsed.slice(0, 3))
    setLyrics(parsed)
  }

  // 播放控制
  const togglePlay = () => {
    if (playerInstance) {
      playerInstance.toggle()
    }
  }

  const skipPrev = () => {
    if (!playerInstance || audioList.length === 0) return
    
    let newIndex = currentIndex - 1
    if (newIndex < 0) {
      newIndex = audioList.length - 1 // 循环到最后一首
    }
    
    console.log('[MusicPlayer] Skip prev:', currentIndex, '->', newIndex)
    selectSong(newIndex)
  }

  const skipNext = () => {
    if (!playerInstance || audioList.length === 0) return
    
    let newIndex = currentIndex + 1
    if (newIndex >= audioList.length) {
      newIndex = 0 // 循环到第一首
    }
    
    console.log('[MusicPlayer] Skip next:', currentIndex, '->', newIndex)
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

  // 查找当前歌词索引
  const getCurrentLyricIndex = () => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        return i
      }
    }
    return -1
  }

  // 选择歌曲 - 直接更新状态而不是等待事件
  const selectSong = async (index: number) => {
    if (!playerInstance || !audioList[index]) return
    
    console.log('[MusicPlayer] User selecting song:', {
      index,
      name: audioList[index].name,
      currentIndex
    })
    
    try {
      // 先更新 UI 状态
      const songData = audioList[index]
      setCurrentIndex(index)
      setCurrentAudio({ ...songData })
      await parseLyrics(songData.lrc)
      setRenderKey(prev => prev + 1)
      
      // 然后切换音频
      playerInstance.switchAudio(index)
      
      // 确保播放
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

  const currentLyricIndex = getCurrentLyricIndex()

  // 自动滚动歌词
  useEffect(() => {
    if (currentLyricIndex >= 0 && isExpanded && showLyrics) {
      const lyricsContainer = document.querySelector('.lyrics-container')
      const currentLine = document.querySelector('.lyric-line.current')
      
      if (lyricsContainer && currentLine) {
        const containerHeight = lyricsContainer.clientHeight
        const lineOffset = (currentLine as HTMLElement).offsetTop
        const lineHeight = (currentLine as HTMLElement).clientHeight
        
        // 计算滚动位置，使当前行居中
        const scrollPosition = lineOffset - (containerHeight / 2) + (lineHeight / 2)
        
        lyricsContainer.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        })
      }
    }
  }, [currentLyricIndex, isExpanded, showLyrics])

  return (
    <>
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
          {/* 迷你模式下的歌词 */}
          {showLyrics && currentAudio && (
            <div className="mini-lyrics">
              {currentLyricIndex >= 0 && lyrics[currentLyricIndex] ? (
                <span>{lyrics[currentLyricIndex].text}</span>
              ) : (
                <span>{currentAudio.name} - {currentAudio.artist}</span>
              )}
            </div>
          )}
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
          
          {/* 内容区域 - 在遮罩层之上 */}
          <div className="player-content">
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
                    {index === currentIndex && (
                      <span className="playlist-item-playing">♫</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 顶部关闭按钮行 */}
            {!showPlaylist && (
              <div className="player-top-bar">
                <div className="player-top-spacer" />
                <button 
                  className="player-close"
                  onClick={() => setIsExpanded(false)}
                  title="关闭"
                >
                  ×
                </button>
              </div>
            )}

            {/* 歌词区域 */}
            <div className={`lyrics-container ${!showLyrics ? 'hidden' : ''}`}>
              {showLyrics && (
                lyrics.length > 0 ? (
                  lyrics.map((line, index) => (
                    <div
                      key={index}
                      className={`lyric-line ${index === currentLyricIndex ? 'current' : ''}`}
                    >
                      {line.text}
                    </div>
                  ))
                ) : (
                  <div className="no-lyrics">纯音乐</div>
                )
              )}
            </div>

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
                </button>
                <button 
                  className="playlist-btn"
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  title="播放列表"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
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
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>
              
              <button className="control-btn main" onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
                {isPlaying ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              
              <button className="control-btn" onClick={skipNext} title="下一首">
                <svg viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
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
