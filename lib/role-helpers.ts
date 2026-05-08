/**
 * Role formatting utilities for production-ready multi-user support
 */

export function formatRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Admin'
    case 'CAMPAIGN_MANAGER':
      return 'Campaign Manager'
    case 'VIEWER':
      return 'Viewer'
    default:
      return role
  }
}

export function formatUserName(user: { name?: string; email?: string }): string {
  if (user.name) {
    return user.name
  }
  if (user.email) {
    return user.email
  }
  return 'Unknown User'
}

export function getCreatedByText(owner: { name?: string; email?: string; role?: string }): string {
  const userName = formatUserName(owner)
  const roleText = owner.role ? formatRole(owner.role) : ''
  
  if (roleText) {
    return `${userName} (${roleText})`
  }
  
  return userName
}
