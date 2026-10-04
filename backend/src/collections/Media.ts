import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: 'Attribution, e.g. "Wikimedia Commons / CC BY-SA 4.0 / author name".',
      },
    },
  ],
  upload: true,
}
