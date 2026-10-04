import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'viewer',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Agent', value: 'agent' },
        { label: 'Viewer', value: 'viewer' },
      ],
      admin: {
        description:
          'Only admins can publish drafts. Agents can create/update drafts but cannot publish.',
      },
    },
  ],
  versions: false,
}
