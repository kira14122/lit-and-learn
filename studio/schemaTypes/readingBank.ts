import {defineField, defineType} from 'sanity'

/**
 * Reading Bank — one document = one lesson of the reading course.
 *
 * Same authoring workflow as Writing Bank: a short lesson (title + body +
 * examples), then activity rows pasted into bulkData as tab-separated
 * columns from a spreadsheet.
 *
 * Reading additions:
 *  - passage: the text students read and reference during practice
 *    (shown via a "Text" button). Leave empty for strategy lessons
 *    that need no passage — the button simply won't appear.
 *  - passageImage: optional chart/graph/table for visual-literacy lessons.
 *  - trueFalseNG: the classic reading-exam activity type.
 *
 * bulkData column formats by type (columns separated by TAB, one row per line):
 *
 *   multipleChoice:  prompt ⇥ A ⇥ B ⇥ C ⇥ correct(A/B/C) ⇥ why
 *   gapFill:         sentence with ___ ⇥ answer ⇥ why(optional)
 *                    (alternatives allowed in answer with a pipe: however|nevertheless)
 *   combine:         instruction ⇥ given text ⇥ model answer ⇥ hint(optional)
 *   trueFalseNG:     statement ⇥ answer(T/F/NG) ⇥ why
 */
export default defineType({
  name: 'readingBank',
  title: 'Reading Bank',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Lesson Title',
      type: 'string',
      description: 'e.g. "Guessing meaning from context clues"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'The broad reading skill this lesson belongs to.',
      options: {
        list: [
          {title: 'Vocabulary & Decoding', value: 'Vocabulary & Decoding'},
          {title: 'Main Ideas & Structure', value: 'Main Ideas & Structure'},
          {title: 'Reading Strategies', value: 'Reading Strategies'},
          {title: 'Text Architecture', value: 'Text Architecture'},
          {title: 'Inference', value: 'Inference'},
          {title: 'Critical Thinking', value: 'Critical Thinking'},
          {title: 'Research Reading', value: 'Research Reading'},
          {title: 'Literary Analysis', value: 'Literary Analysis'},
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
        'One format per lesson — this decides the bulkData column layout and how students interact with it.',
      options: {
        list: [
          {title: 'Multiple Choice (auto-checked)', value: 'multipleChoice'},
          {title: 'Gap Fill (auto-checked, case-insensitive)', value: 'gapFill'},
          {title: 'Combine & Rewrite (self-check against model answer)', value: 'combine'},
          {title: 'True / False / Not Given (auto-checked)', value: 'trueFalseNG'},
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
      title: 'Lesson Title (shown to students)',
      type: 'string',
      description: 'The heading students see before practising, e.g. "Reading between the lines".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lessonBody',
      title: 'Lesson Explanation',
      type: 'text',
      rows: 6,
      description: 'The short explanation paragraph shown before the activities. Use **word** for bold emphasis.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lessonExamples',
      title: 'Lesson Examples',
      type: 'text',
      rows: 4,
      description: 'One example per line. Use **word** for bold emphasis.',
    }),
    defineField({
      name: 'passage',
      title: 'Reading Passage (optional)',
      type: 'text',
      rows: 12,
      description:
        'The text students read and apply the skill to. Shown on the lesson screen and reachable during practice via a "Text" button. ' +
        'Leave empty for strategy lessons with no passage. Public-domain sources only. Use **word** for bold emphasis.',
    }),
    defineField({
      name: 'passageImage',
      title: 'Passage Image (optional)',
      type: 'image',
      description: 'A chart, graph, or table for visual-literacy lessons. Shown with the passage.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'passageSource',
      title: 'Passage Source (optional)',
      type: 'string',
      description: 'Attribution shown under the passage, e.g. "Franz Kafka, The Metamorphosis (1915)".',
    }),
    defineField({
      name: 'practiceInstruction',
      title: 'Practice Instruction (optional)',
      type: 'string',
      description:
        'One line shown to students above every item during practice, ' +
        'e.g. "Decide if each statement is **True**, **False**, or **Not Given** according to the passage."',
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
        'combine: instruction / given text / model answer / hint (optional). ' +
        'trueFalseNG: statement / T, F, or NG / why.',
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
              : type === 'trueFalseNG'
                ? 'True/False/NG'
                : 'No type set'
      return {
        title: title || 'Untitled lesson',
        subtitle: [category, typeLabel, level].filter(Boolean).join(' · '),
      }
    },
  },
})