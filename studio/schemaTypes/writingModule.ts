import {defineField, defineType} from 'sanity'

/**
 * Writing Module — one document = one module of the master writing course.
 *
 * A module is a numbered chapter (e.g. "Module 4: Paragraph Structure and
 * Transitions") holding an ORDERED list of references to Writing Bank
 * lessons. Drag the references up and down to set the lesson order —
 * the website shows them in exactly this order.
 *
 * The banks themselves are untouched: the same bank can keep its category
 * (for skill-based browsing) and also appear in a module (for the course).
 */
export default defineType({
  name: 'writingModule',
  title: 'Writing Module',
  type: 'document',
  fields: [
    defineField({
      name: 'moduleNumber',
      title: 'Module Number',
      type: 'number',
      description: 'Position in the course: 1, 2, 3... Modules are shown in this order.',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: 'title',
      title: 'Module Title',
      type: 'string',
      description: 'e.g. "Basic Grammar and Punctuation"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Module Description (optional)',
      type: 'text',
      rows: 3,
      description: 'One or two sentences shown under the module title, e.g. what students will be able to do.',
    }),
    defineField({
      name: 'banks',
      title: 'Lessons (in order)',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'writingBank'}]}],
      description: 'Add Writing Bank lessons and drag to reorder. Students see them in this exact order.',
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  orderings: [
    {
      title: 'Module Number',
      name: 'moduleNumberAsc',
      by: [{field: 'moduleNumber', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      moduleNumber: 'moduleNumber',
      title: 'title',
      banks: 'banks',
    },
    prepare({moduleNumber, title, banks}) {
      const count = Array.isArray(banks) ? banks.length : 0
      return {
        title: `Module ${moduleNumber ?? '?'} · ${title || 'Untitled'}`,
        subtitle: `${count} lesson${count === 1 ? '' : 's'}`,
      }
    },
  },
})