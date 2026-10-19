import type { GlobalConfig } from 'payload'

import { adminOrAgentWrite, publicRead } from '../access/roles'

export const TimetableInfo: GlobalConfig = {
  slug: 'timetable-info',
  label: 'Timetable validity',
  access: {
    read: publicRead,
    update: adminOrAgentWrite,
  },
  fields: [
    {
      name: 'validFrom',
      type: 'date',
      admin: { description: 'First date the currently loaded timetable data is valid for.' },
    },
    {
      name: 'validTo',
      type: 'date',
      admin: { description: 'Last date the currently loaded timetable data is valid for.' },
    },
    {
      name: 'source',
      type: 'text',
      admin: { description: 'Where this timetable data came from, e.g. a GTFS feed name/URL.' },
    },
    {
      name: 'plkSchedulesVersion',
      type: 'text',
      admin: {
        description:
          "Last-seen value of PKP PLK's own schedulesVersion GUID (from GET /api/v1/data-version) -- used by the sync-timetables job to detect a real amendment without re-fetching every station's schedule on every run.",
      },
    },
  ],
}
