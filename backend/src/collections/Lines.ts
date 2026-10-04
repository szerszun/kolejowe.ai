import type { CollectionConfig } from 'payload'

import { adminOrAgentWrite, adminOnly, publicRead, requireAdminToPublish } from '../access/roles'

export const Lines: CollectionConfig = {
  slug: 'lines',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['number', 'name', 'status', '_status', 'updatedAt'],
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
        { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true },
      ],
    },
    {
      name: 'tenders',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'status', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'deadline', type: 'date' },
        { name: 'url', type: 'text' },
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
