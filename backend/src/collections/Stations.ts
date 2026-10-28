import type { CollectionConfig } from 'payload'

import { adminOrAgentWrite, adminOnly, publicRead, requireAdminToPublish } from '../access/roles'
import { getLiveMovements } from '../lib/liveMovements'

const movementFields = (kind: 'departure' | 'arrival'): CollectionConfig['fields'] => [
  { name: 'time', type: 'text', required: true, admin: { description: 'HH:mm, 24h' } },
  // maxDepth 0: never populated. Every timetable entry would otherwise embed its whole
  // line, geometry included, at depth 1 -- `/api/stations?limit=0&depth=1` ran out of
  // memory that way. The frontend only reads the id (relId in src/lib/payloadClient.ts).
  { name: 'lineId', type: 'relationship', relationTo: 'lines', required: true, maxDepth: 0 },
  { name: 'operator', type: 'text' },
  { name: 'platform', type: 'text' },
  { name: 'trainNumber', type: 'text', admin: { description: 'e.g. "66139" or "6128/9"' } },
  { name: 'trainName', type: 'text', admin: { description: 'Named train, e.g. "Mickiewicz" -- only some trains have one.' } },
  {
    name: 'daysOfOperation',
    type: 'select',
    options: [
      { label: 'Daily', value: 'daily' },
      { label: 'Weekdays', value: 'weekdays' },
      { label: 'Weekend', value: 'weekend' },
      { label: 'Other / irregular', value: 'other' },
    ],
  },
  {
    name: kind === 'departure' ? 'destination' : 'origin',
    type: 'text',
    required: true,
  },
]

export const Stations: CollectionConfig = {
  slug: 'stations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'id', '_status', 'updatedAt'],
  },
  access: {
    read: publicRead,
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
  },
  endpoints: [
    {
      path: '/:id/live',
      method: 'get',
      handler: async (req) => {
        const id = req.routeParams?.id
        if (typeof id !== 'string') {
          return Response.json({ available: false }, { status: 400 })
        }

        const station = await req.payload
          .findByID({ collection: 'stations', id, overrideAccess: true, depth: 0 })
          .catch(() => null)

        if (!station?.plkStationId) {
          return Response.json({ available: false, reason: 'not_matched' })
        }

        try {
          const result = await getLiveMovements(station.plkStationId)
          if (!result.ok) return Response.json({ available: false, reason: result.reason })
          return Response.json({ available: true, stale: result.stale, movements: result.movements })
        } catch (err) {
          req.payload.logger.error(err)
          return Response.json({ available: false, reason: 'upstream_error' })
        }
      },
    },
  ],
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
      admin: {
        description: 'Canonical id, e.g. "osm-155479759". Shared across every line that serves this station.',
      },
    },
    { name: 'name', type: 'text', required: true },
    {
      name: 'coordinates',
      type: 'point',
      required: true,
      admin: { description: '[longitude, latitude]' },
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'plkStationId',
      type: 'number',
      admin: {
        description:
          'PKP PLK Open Data API station id, used to fetch live arrivals/departures. Populated by the matchPlkStations job; left empty if no confident name match was found.',
      },
    },
    { name: 'category', type: 'text' },
    { name: 'address', type: 'text' },
    { name: 'yearBuilt', type: 'number' },
    { name: 'platformCount', type: 'number' },
    { name: 'accessibility', type: 'textarea' },
    {
      name: 'amenities',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      // Links directly to the source image (e.g. Wikimedia) rather than
      // uploading a local copy -- avoids needing any file storage at all,
      // which matters on hosts with an ephemeral filesystem (e.g. Render's
      // free tier). Trade-off: the photo breaks if the source URL does.
      name: 'photo',
      type: 'group',
      fields: [
        { name: 'url', type: 'text' },
        { name: 'credit', type: 'text', admin: { description: 'e.g. "Wikimedia Commons / CC BY-SA 4.0 / author name".' } },
      ],
    },
    {
      name: 'timetable',
      type: 'array',
      label: 'Departures',
      fields: movementFields('departure'),
    },
    {
      name: 'arrivals',
      type: 'array',
      fields: movementFields('arrival'),
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
  ],
}
