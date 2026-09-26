import { sponsor, site } from '@/config.json'
import { motion } from 'framer-motion'
import * as QR from 'qrcode.react'
import { useAtomValue } from 'jotai'
import { metaSlugAtom, metaTitleAtom } from '@/store/metaInfo'
import clsx from 'clsx'
import { toast } from 'react-toastify'
import { useModal, useCurrentModal } from '@/components/ui/modal'

interface ShareData {
  url: string
  text: string
}

const shareList = [
  {
    name: 'Twitter / X',
    icon: 'icon-x',
    desc: '分享到社交网络',
    onClick: (data: ShareData) => {
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text)}&via=${encodeURIComponent(site.title)}`,
      )
    },
  },
  {
    name: '复制链接',
    icon: 'icon-link',
    desc: '复制文章永久直达链接',
    onClick: (data: ShareData) => {
      navigator.clipboard.writeText(data.url)
      toast.success('已复制到剪贴板')
    },
  },
]

export function ActionAside() {
  return (
    <div
      className="absolute left-0 bottom-0 flex flex-col gap-4 glass-card p-3"
      style={{
        transform: 'translateY(calc(100% + 24px))',
      }}
    >
      <ShareButton />
      <DonateButton />
    </div>
  )
}

export function MobileActionBar() {
  return (
    <div className="flex items-center justify-around py-3 px-4 rounded-xl bg-secondary/50 border border-primary/20">
      <div className="flex items-center gap-2">
        <ShareButton />
        <span className="text-xs text-secondary">分享文章</span>
      </div>
      <div className="h-4 w-px bg-primary/20" />
      <div className="flex items-center gap-2">
        <DonateButton />
        <span className="text-xs text-secondary">赞赏作者</span>
      </div>
    </div>
  )
}

function ShareButton() {
  const postSlug = useAtomValue(metaSlugAtom)
  const postTitle = useAtomValue(metaTitleAtom)
  const { present } = useModal()

  const url = new URL(postSlug, site.url).href
  const text = `嘿，我发现了一片宝藏文章「${postTitle}」哩，快来看看吧！`

  const openModal = () => {
    present({
      content: <ShareModal url={url} text={text} />,
    })
  }

  return (
    <button
      type="button"
      aria-label="Share this post"
      className="size-6 text-xl leading-none hover:text-accent"
      onClick={() => openModal()}
    >
      <i className="iconfont icon-share"></i>
    </button>
  )
}

function ShareModal({ url, text }: { url: string; text: string }) {
  const { dismiss } = useCurrentModal()
  const postTitle = useAtomValue(metaTitleAtom)

  return (
    <motion.div
      className="w-[90vw] max-w-[460px] overflow-hidden rounded-2xl border border-primary/20 bg-white/90 p-5 shadow-2xl backdrop-blur-2xl dark:border-zinc-700/40 dark:bg-zinc-900/90 flex flex-col"
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-primary/15">
        <div className="flex items-center gap-2">
          <i className="iconfont icon-share text-accent text-lg" />
          <h2 className="font-semibold text-primary text-base">分享文章</h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="size-8 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
          aria-label="关闭分享窗口"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {postTitle && (
        <p className="mt-3 text-xs text-secondary line-clamp-1 italic">「{postTitle}」</p>
      )}

      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
        {/* 白底卡片包裹二维码，暗色模式下绝不穿帮 */}
        <div className="shrink-0 p-3 rounded-xl bg-white shadow-sm border border-zinc-200/80 flex items-center justify-center">
          <QR.QRCodeSVG value={url} size={130} />
        </div>

        {/* 交互按钮组 */}
        <div className="w-full flex-1 flex flex-col gap-2">
          <div className="text-xs text-secondary/80">点击选择分享方式：</div>
          {shareList.map((item) => (
            <button
              key={item.name}
              type="button"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-secondary/50 hover:bg-accent/10 hover:border-accent/40 border border-primary/15 transition-all text-sm group text-left"
              onClick={() => {
                item.onClick({ url, text })
                if (item.name === '复制链接') {
                  setTimeout(dismiss, 600)
                }
              }}
            >
              <div className="flex items-center gap-2.5">
                <i className={clsx('iconfont text-base text-accent', item.icon)} />
                <span className="font-medium text-primary group-hover:text-accent transition-colors">
                  {item.name}
                </span>
              </div>
              <i className="iconfont icon-external-link text-xs opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-accent" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function DonateButton() {
  const { present } = useModal()

  const openDonate = () => {
    present({
      content: <DonateContent />,
    })
  }

  return (
    <button
      type="button"
      aria-label="Donate to author"
      className="size-6 text-xl leading-none hover:text-accent"
      onClick={() => openDonate()}
    >
      <i className="iconfont icon-user-heart"></i>
    </button>
  )
}

function DonateContent() {
  const { dismiss } = useCurrentModal()
  const sponsorConfig = sponsor as any
  const qrcode = sponsorConfig.qrcode || sponsorConfig.wechat || ''
  const validLinks = Array.isArray(sponsorConfig.links)
    ? sponsorConfig.links.filter((l: any) => l.url && l.url.trim() !== '')
    : []
  const description = sponsorConfig.description || '感谢您的支持，这将成为我前进的最大动力。'

  const hasContent = Boolean(qrcode || validLinks.length > 0)

  return (
    <motion.div
      className="w-[90vw] max-w-[440px] overflow-hidden rounded-2xl border border-primary/20 bg-white/90 p-5 shadow-2xl backdrop-blur-2xl dark:border-zinc-700/40 dark:bg-zinc-900/90 flex flex-col"
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-primary/15">
        <div className="flex items-center gap-2">
          <i className="iconfont icon-user-heart text-accent text-lg" />
          <h2 className="font-semibold text-primary text-base">赞赏支持</h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="size-8 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
          aria-label="关闭赞赏窗口"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="mt-3 text-center text-sm text-secondary leading-relaxed">{description}</p>

      {!hasContent && (
        <div className="py-8 text-center text-sm text-secondary/80">
          站长暂未开通赞助渠道，感谢您的心意！
        </div>
      )}

      {qrcode && (
        <div className="flex justify-center my-3 p-3 rounded-xl bg-white shadow-sm border border-zinc-200/80 w-fit mx-auto">
          <img
            className="object-contain rounded-lg"
            width={200}
            height={200}
            src={qrcode}
            alt="赞赏二维码"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {validLinks.length > 0 && (
        <div className="w-full mt-3 flex flex-col gap-2">
          {validLinks.map((item: any) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer external"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-secondary/50 hover:bg-accent/10 hover:border-accent/40 border border-primary/15 transition-all text-sm group text-left"
            >
              <div className="flex items-center gap-2.5">
                <i className={clsx('iconfont text-base text-accent', item.icon || 'icon-hearts')} />
                <span className="font-medium text-primary group-hover:text-accent transition-colors">
                  {item.name}
                </span>
              </div>
              <i className="iconfont icon-external-link text-xs opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-accent" />
            </a>
          ))}
        </div>
      )}
    </motion.div>
  )
}
