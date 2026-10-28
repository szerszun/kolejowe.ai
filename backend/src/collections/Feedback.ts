import { APIError, type CollectionConfig } from 'payload'

import { adminOnly } from '../access/roles'
import { slidingWindowLimit } from '../lib/slidingWindowLimit'

// Anyone can submit feedback, so without limits a script could fill the (small, free)
// Neon database. The cap is site-wide, not per visitor: which X-Forwarded-For entry is
// the real client behind Render's proxies isn't something this code can verify, and
// trusting the wrong one either lets a script dodge the limit or throttles everyone as
// one "visitor". Real feedback arrives a few times a week; 30 an hour is far above that.
// Signed-in users (admins, agents) aren't counted.
const tryAnonymousSubmission = slidingWindowLimit(30, 60 * 60 * 1000)

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
  hooks: {
    beforeOperation: [
      ({ operation, req, args }) => {
        if (operation === 'create' && !req.user && !tryAnonymousSubmission()) {
          throw new APIError('Too much feedback is arriving right now -- please try again later.', 429)
        }
        return args
      },
    ],
  },
  fields: [
    // 2000 matches the textarea's maxLength in src/components/FeedbackButton.tsx.
    { name: 'message', type: 'textarea', required: true, maxLength: 2000 },
    { name: 'page', type: 'text', maxLength: 500, admin: { description: 'URL path the user was on when they submitted this.' } },
    { name: 'language', type: 'text', maxLength: 35 },
    { name: 'userAgent', type: 'text', maxLength: 500 },
  ],
}
