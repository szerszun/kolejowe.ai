import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/roles'

export const Feedback: CollectionConfig = {
  slug: 'feedback',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['message', 'page', 'createdAt'],
  },
  access: {
    read: adminOnly,
    create: () => true,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'message', type: 'textarea', required: true },
    { name: 'page', type: 'text', admin: { description: 'URL path the user was on when they submitted this.' } },
    { name: 'language', type: 'text' },
    { name: 'userAgent', type: 'text' },
  ],
}
