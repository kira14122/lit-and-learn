import {defineField, defineType} from 'sanity'

/**
 * Writing Bank — one document = one bank of writing activities.
 *
 * A bank has ONE type (multipleChoice / gapFill / combine), a short lesson
 * (title + body + examples), and its activity rows pasted into bulkData as
 * tab-separated columns from a spreadsheet — same workflow as the quiz banks.
 *
 * bulkData column formats by type (columns separated by TAB, one row per line):
 *
 *   multipleChoice:  prompt ⇥ A ⇥ B ⇥ C ⇥ correct(A/B/C) ⇥ why
 *   gapFill:         sentence with ___ ⇥ answer ⇥ why(optional)
 *                    (alternatives allowed in answer with a pipe: however|nevertheless)
 *   combine:         instruction ⇥ given text ⇥ model answer ⇥ hint(optional)
 */
export default defineType({
  name: 'writingBank',
  title: 'Writing Bank',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Bank Title',
      type: 'string',
      description: 'e.g. "Linking words: contrast"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'The group this bank appears under in the Writing Hub category strip.',
      options: {
        list: [
          {title: 'Linking Words', value: 'Linking Words'},
          {title: 'Punctuation', value: 'Punctuation'},
          {title: 'Sentence Structure', value: 'Sentence Structure'},
          {title: 'Paragraph Writing', value: 'Paragraph Writing'},
          {title: 'Formal vs Informal', value: 'Formal vs Informal'},
          {title: 'Common Errors', value: 'Common Errors'},
          {title: 'Essay Structure', value: 'Essay Structure'},
          {title: 'The Writing Process', value: 'The Writing Process'},
          {title: 'Using Sources', value: 'Using Sources'},
          {title: 'Writing About Literature', value: 'Writing About Literature'},
          {title: 'Academic Vocabulary', value: 'Academic Vocabulary'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Activity Type',
      type: 'string',
      description:
        'One format per bank — this decides the bulkData column layout and how students interact with it.',
      options: {
        list: [
          {title: 'Multiple Choice (auto-checked)', value: 'multipleChoice'},
          {title: 'Gap Fill (auto-checked, case-insensitive)', value: 'gapFill'},
          {title: 'Combine & Rewrite (self-check against model answer)', value: 'combine'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'level',
      title: 'CEFR Level (optional)',
      type: 'string',
      options: {
        list: [
          {title: 'A1', value: 'A1'},
          {title: 'A2', value: 'A2'},
          {title: 'B1', value: 'B1'},
          {title: 'B2', value: 'B2'},
          {title: 'C1', value: 'C1'},
          {title: 'C2', value: 'C2'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'lessonTitle',
      title: 'Lesson Title',
      type: 'string',
      description: 'The heading students see before practising, e.g. "Showing contrast with However".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lessonBody',
      title: 'Lesson Explanation',
      type: 'text',
      rows: 6,
      description: 'The short explanation paragraph shown before the activities.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lessonExamples',
      title: 'Lesson Examples',
      type: 'text',
      rows: 4,
      description: 'One example sentence per line.',
    }),
    defineField({
      name: 'practiceInstruction',
      title: 'Practice Instruction (optional)',
      type: 'string',
      description:
        'One line shown to students above every item during practice. ' +
        'For gap fill, include the word choices, e.g. "Complete each sentence with **and**, **but**, or **or**." ' +
        '(**word** shows as bold.)',
    }),
    defineField({
      name: 'bulkData',
      title: 'Bulk Activity Data',
      type: 'text',
      rows: 14,
      description:
        'Paste rows from a spreadsheet (columns become TABs). One activity per line. ' +
        'Formats — multipleChoice: prompt / A / B / C / correct letter / why. ' +
        'gapFill: sentence with ___ / answer (use | for alternatives) / why (optional). ' +
        'combine: instruction / given text / model answer / hint (optional).',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      type: 'type',
      level: 'level',
    },
    prepare({title, category, type, level}) {
      const typeLabel =
        type === 'multipleChoice'
          ? 'Multiple Choice'
          : type === 'gapFill'
            ? 'Gap Fill'
            : type === 'combine'
              ? 'Combine & Rewrite'
              : 'No type set'
      return {
        title: title || 'Untitled bank',
        subtitle: [category, typeLabel, level].filter(Boolean).join(' · '),
      }
    },
  },
})