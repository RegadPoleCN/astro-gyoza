import { BluredBackground } from './BluredBackground'
import { HeaderContent } from './HeaderContent'
import { SearchButton } from './SearchButton'
import { HeaderThemeToggle } from './HeaderThemeToggle'
import { AnimatedLogo } from './AnimatedLogo'
import { HeaderMeta } from './HeaderMeta'
import { HeaderDrawer } from './HeaderDrawer'
import { useIsMobile } from './hooks'

export function Header() {
  const isMobile = useIsMobile()

  return (
    <header className="fixed top-0 inset-x-0 h-[64px] z-10 overflow-hidden">
      <BluredBackground />
      <div className="max-w-[1100px] h-full px-4 mx-auto flex items-center justify-between">
        <div className="flex items-center">{isMobile ? <HeaderDrawer /> : <AnimatedLogo />}</div>
        <div className="relative flex items-center justify-center flex-1 mx-2">
          {isMobile ? <AnimatedLogo /> : <HeaderContent />}
          <HeaderMeta />
        </div>
        <div className="flex items-center gap-2">
          <HeaderThemeToggle />
          <SearchButton />
        </div>
      </div>
    </header>
  )
}
