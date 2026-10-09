import type { CollectionConfig } from 'payload'

import { adminOrAgentWrite, adminOnly, publicRead, requireAdminToPublish } from '../access/roles'

const movementFields = (kind: 'departure' | 'arrival'): CollectionConfig['fields'] => [
  { name: 'time', type: 'text', required: true, admin: { description: 'HH:mm, 24h' } },
  { name: 'lineId', type: 'relationship', relationTo: 'lines', required: true },
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
    { name: 'photo', type: 'upload', relationTo: 'media' },
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
