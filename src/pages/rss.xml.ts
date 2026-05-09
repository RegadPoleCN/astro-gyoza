/**
 * RSS Feed 生成器 - 支持 Follow 阅读器认证
 *
 * 环境变量说明：
 * - FOLLOW_FEED_ID: Follow Feed ID（可选，优先级高于 config.json）
 * - FOLLOW_USER_ID: Follow User ID（可选，优先级高于 config.json）
 *
 * 配置优先级：环境变量 > config.json rss.follow.feedId/userId
 *
 * 安全提醒：
 * - 请勿将真实凭证提交到 Git 仓库
 * - 建议使用环境变量或 CI/CD 密钥管理工具存储敏感信息
 * - 开发环境下凭证不会明文显示在日志中
 */
import type { APIContext } from 'astro'
import type { CollectionEntry } from 'astro:content'
import rss from '@astrojs/rss'
import config from '@/config.json'
import { getSortedPosts } from '@/utils/content'

const { site, rss: rssConfig } = config

interface FollowConfig {
  enable: boolean
  feedId: string
  userId: string
}

function getFollowConfig(): { feedId: string; userId: string } | null {
  const envFeedId = process.env.FOLLOW_FEED_ID
  const envUserId = process.env.FOLLOW_USER_ID

  if (
    envFeedId &&
    typeof envFeedId === 'string' &&
    envFeedId.trim() !== '' &&
    envUserId &&
    typeof envUserId === 'string' &&
    envUserId.trim() !== ''
  ) {
    return {
      feedId: envFeedId.trim(),
      userId: envUserId.trim(),
    }
  }

  const followConfig = rssConfig?.follow as FollowConfig | undefined

  if (!followConfig || !followConfig.enable) {
    return null
  }

  const feedId = followConfig.feedId?.trim() || ''
  const userId = followConfig.userId?.trim() || ''

  if (!feedId || !userId) {
    console.warn('[RSS] Follow 已启用但缺少 feedId 或 userId，将降级为标准 RSS')
    return null
  }

  return { feedId, userId }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function GET(context: APIContext) {
  const sortedPosts = (await getSortedPosts()) as CollectionEntry<'posts'>[]
  const followConfig = getFollowConfig()

  let customData = `<language>${site.lang}</language>`

  if (followConfig) {
    customData += `
<follow_challenge>
<userId>${escapeXml(followConfig.userId)}</userId>
<feedId>${escapeXml(followConfig.feedId)}</feedId>
</follow_challenge>`
  }

  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: sortedPosts.map((post) => ({
      link: `/posts/${post.slug}`,
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
    })),
    customData,
  })
}
