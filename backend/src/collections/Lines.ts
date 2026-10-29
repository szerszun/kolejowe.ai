import type { CollectionConfig, Payload, PayloadRequest } from 'payload'

import { adminOrAgentWrite, adminOnly, publishedOrEditor, requireAdminToPublish } from '../access/roles'
import { cachedValue } from '../lib/cachedValue'

/** Without `req`, access is checked as a logged-out visitor: published lines and stations only. */
async function buildMapResponse(payload: Payload, req?: PayloadRequest) {
  const lines = await payload.find({
    collection: 'lines',
    depth: 1,
    limit: 0,
    req,
    overrideAccess: false,
    populate: payload.db.name === 'sqlite' ? undefined : { stations: { name: true, coordinates: true } },
  })
  const docs = lines.docs.map((line) => ({
    ...line,
    // A station the caller can't read (unpublished) stays a bare id, as in the REST API.
    stations: (line.stations ?? []).map((s) =>
      typeof s === 'string' ? s : { id: s.id, name: s.name, coordinates: s.coordinates },
    ),
  }))
  return JSON.stringify({ ...lines, docs })
}

/**
 * The public (logged-out) /api/lines/map response, which every visitor's first page load
 * fetches. Building it takes 1.5-3.5 s on Render's free CPU, while the data only changes
 * when a line or station is saved -- by an editor or the timetable sync. Cleared by the
 * afterChange/afterDelete hooks here and in Stations.ts. Editors bypass it: they can see
 * drafts, which the public response mustn't include.
 */
let publicMap: ReturnType<typeof cachedValue<string>> | undefined
export function invalidateMapCache(): void {
  publicMap?.invalidate()
}

export const Lines: CollectionConfig = {
  slug: 'lines',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['number', 'name', 'status', '_status', 'updatedAt'],
  },
  access: {
    read: publishedOrEditor,
    create: adminOrAgentWrite,
    update: adminOrAgentWrite,
    delete: adminOnly,
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  hooks: {
    beforeChange: [requireAdminToPublish],
    afterChange: [invalidateMapCache],
    afterDelete: [invalidateMapCache],
  },
  endpoints: [
    {
      // Every line for the map (src/lib/payloadClient.ts fetchLines), with each station
      // cut down to what the map draws. `/api/lines?limit=0&depth=1` embeds every
      // station's full timetable instead: 8.9 MB and ~20 s per home page load on Render.
      //
      // Not a `populate` query parameter on the REST call, because SQLite (local dev, CI)
      // drops point fields whenever a select is active -- Payload's drizzle adapter skips
      // `point` for SQLite in find/traverseFields -- so stations would lose coordinates.
      // There the stations are read in full and trimmed here; the local data is small.
      path: '/map',
      method: 'get',
      handler: async (req) => {
        if (req.user) {
          return new Response(await buildMapResponse(req.payload, req), { headers: { 'Content-Type': 'application/json' } })
        }
        // No req: a cached build must not hold on to the request that happened to start it.
        const { payload } = req
        publicMap ??= cachedValue(() => buildMapResponse(payload))
        return new Response(await publicMap.get(), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
        })
      },
    },
  ],
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
      admin: { description: 'PKP line number, e.g. "277". Same as `number`.' },
    },
    { name: 'number', type: 'text', required: true },
    { name: 'name', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      // Without this, Postgres collides this field's enum type name with
      // the one Payload generates for the built-in `_status` (draft/
      // published) field -- both land on "enum_lines_status", and whichever
      // gets created second silently reuses the first one instead of
      // failing, so every line write was rejected with "invalid input value
      // for enum enum_lines_status: active_passenger". SQLite has no named
      // enum types, so this never showed up locally.
      enumName: 'line_status',
      options: [
        { label: 'Active passenger', value: 'active_passenger' },
        { label: 'Freight only', value: 'freight_only' },
        { label: 'Planned', value: 'planned' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    { name: 'electrified', type: 'checkbox', defaultValue: false },
    { name: 'lengthKm', type: 'number', required: true },
    { name: 'tracks', type: 'number', required: true },
    { name: 'maxSpeedKmh', type: 'number', required: true },
    {
      name: 'manuallyCurated',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Line 275 in the spec has a manually curated Notion structure.' },
    },
    {
      name: 'operators',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    {
      name: 'passengerServices',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    {
      name: 'endStations',
      type: 'array',
      minRows: 2,
      maxRows: 2,
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    {
      name: 'stations',
      type: 'relationship',
      relationTo: 'stations',
      hasMany: true,
      admin: {
        description: 'In geometry order, from one end of the line to the other.',
      },
    },
    {
      name: 'geometry',
      type: 'json',
      admin: {
        description:
          'Array of [longitude, latitude] pairs. Source of truth for the map polyline -- same shape as the current src/data/geometry/*.json files.',
      },
    },
    {
      name: 'history',
      type: 'group',
      fields: [
        {
          name: 'timeline',
          type: 'array',
          fields: [
            { name: 'year', type: 'number', required: true },
            { name: 'label', type: 'text', required: true },
          ],
        },
        { name: 'narrative', type: 'textarea' },
        {
          // Same reasoning as Stations.photo -- direct source links, no
          // upload/file storage needed.
          name: 'photos',
          type: 'array',
          fields: [
            { name: 'url', type: 'text', required: true },
            { name: 'credit', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'tenders',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'authority', type: 'text' },
        { name: 'estimatedValuePLN', type: 'number' },
        { name: 'publicationDate', type: 'date' },
        { name: 'deadline', type: 'date' },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Open', value: 'open' },
            { label: 'Closed', value: 'closed' },
            { label: 'Awarded', value: 'awarded' },
          ],
        },
        { name: 'url', type: 'text' },
        {
          name: 'matchType',
          type: 'select',
          options: [
            { label: 'Auto-matched', value: 'auto-matched' },
            { label: 'Confirmed', value: 'confirmed' },
          ],
        },
      ],
    },
    {
      name: 'sources',
      type: 'array',
      fields: [
        { name: 'section', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text' },
        { name: 'lastUpdated', type: 'date' },
      ],
    },
    {
      name: 'changeSummary',
      type: 'textarea',
      admin: {
        description:
          'Agent-written note on this draft: what changed and why, and what source it came from. Read this before publishing.',
        position: 'sidebar',
      },
    },
  ],
}
