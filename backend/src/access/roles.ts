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
 * For collections with drafts: everyone reads published documents; only admins and
 * agents read drafts. With plain publicRead, `?draft=true` (or a filter on `_status`)
 * handed anonymous visitors an agent's unreviewed edit before an admin published it.
 * Returning a query, not false, keeps published documents public. An anonymous
 * `?draft=true` on a document with a pending draft gets 404 rather than the published
 * version (the query runs against the latest version) -- the frontend never sends it.
 */
export const publishedOrEditor: Access = ({ req: { user } }) =>
  isAdminOrAgent(user as User | null) || { _status: { equals: 'published' } }

/**
 * Enforces the human-review boundary: only an admin's write can set
 * _status to "published". An agent's write is always forced back to
 * "draft", no matter what it sent -- publishing only happens from the
 * admin UI (or an admin-authenticated API call).
 *
 * A request with no `req.user` at all (the Local API called from a
 * trusted server-side script, e.g. the seed script) is left alone: by
 * the time code is running server-side with direct Local API access, it
 * already has full database access, so this check only has something
 * meaningful to enforce once a specific *agent* identity is attached to
 * the request (REST/GraphQL with an API key, or an authenticated
 * non-admin user).
 */
export const requireAdminToPublish: CollectionBeforeChangeHook = ({ req, data }) => {
  const user = req.user as User | null
  if (data?._status === 'published' && user && !isAdmin(user)) {
    data._status = 'draft'
  }
  return data
}
