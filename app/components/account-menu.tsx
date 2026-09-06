"use client"
import {
  User,
  Settings,
  Mail,
  Gem,
  Check,
  LogOut,
} from "lucide-react"

interface AccountMenuProps {
  isOpen: boolean
  onClose: () => void
  accountName?: string
  accountPicture?: string
  onLogout?: () => void
}

export function AccountMenu({ isOpen, onClose, accountName = "Account", accountPicture, onLogout }: AccountMenuProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Account Menu */}
      <div className="fixed bottom-20 left-4 z-50 w-80 rounded-lg border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="p-2">
          {/* Menu Items */}
          <button
            onClick={() => {
              window.location.href = "/api/auth/google"
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded transition-colors"
          >
            <User className="h-4 w-4 shrink-0" />
            <span>Account</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded transition-colors">
            <Mail className="h-4 w-4 shrink-0" />
            <span>Assistant</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded transition-colors">
            <Gem className="h-4 w-4 shrink-0" />
            <span>Pro Perks</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded transition-colors">
            <Settings className="h-4 w-4 shrink-0" />
            <span>All settings</span>
          </button>

          <div className="my-2 border-t border-border" />

          <div className="my-2 border-t border-border" />

          {/* Profile Switcher */}
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded transition-colors group">
            {accountPicture ? (
              <img src={accountPicture} alt="Google profile" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {accountName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="flex-1 text-left">{accountName}</span>
            <Check className="h-4 w-4 text-primary shrink-0" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded transition-colors group"
          >
            <LogOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-left">Log out</span>
          </button>
        </div>
      </div>
    </>
  )
}
