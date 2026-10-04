import type { Access, CollectionBeforeChangeHook } from 'payload'
import type { User } from '../payload-types'

export const isAdmin = (user: User | null): boolean => user?.role === 'admin'
export const isAdminOrAgent = (user: User | null): boolean =>
  user?.role === 'admin' || user?.role === 'agent'

/** Admins and agents can create/update documents (as drafts). */
export const adminOrAgentWrite: Access = ({ req: { user } }) => isAdminOrAgent(user as User | null)

/** Only admins can delete published data outright. */
export const adminOnly: Access = ({ req: { user } }) => isAdmin(user as User | null)

export const publicRead: Access = () => true

/**
 * Enforces the human-review boundary: only an admin's write can set
 * _status to "published". An agent's write is always forced back to
 * "draft", no matter what it sent -- publishing only happens from the
 * admin UI (or an admin-authenticated API call).
 */
export const requireAdminToPublish: CollectionBeforeChangeHook = ({ req, data }) => {
  const user = req.user as User | null
  if (data?._status === 'published' && !isAdmin(user)) {
    data._status = 'draft'
  }
  return data
}
