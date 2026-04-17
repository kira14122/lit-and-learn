export default {
  name: 'interactiveLesson',
  title: 'Interactive Lesson',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Lesson Title',
      type: 'string',
      description: 'e.g., "The Extreme Reality of Mount Everest"',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'lessonOrder',
      title: 'Module Number (Order)',
      type: 'number',
      description: 'The order this lesson appears in the syllabus (e.g., 1, 2, 3)',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'level',
      title: 'Proficiency Level',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'Beginner' },
          { title: 'Intermediate', value: 'Intermediate' },
          { title: 'Advanced', value: 'Advanced' }
        ]
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'subLevel',
      title: 'Sub-Level Curriculum',
      type: 'string',
      description: 'e.g., "Level 7", "Level 8", "Business English"',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'unit',
      title: 'Unit Number',
      type: 'number',
      description: 'Which unit does this belong to? (e.g., 1)',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'lessonBlocks',
      title: 'Lesson Pipeline (The Blocks)',
      type: 'array',
      description: 'Build your lesson here! Add the blocks in the exact order the student should experience them.',
      of: [
        { type: 'warmUpBlock' },
        { type: 'readingBlock' },
        { type: 'vocabBlock' },
        { type: 'grammarBlock' },
        { type: 'pronunciationBlock' },
        { type: 'comprehensionBlock' },
        { type: 'inductiveGrammarBlock' }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      unit: 'unit',
      subLevel: 'subLevel',
      module: 'lessonOrder'
    },
    prepare(selection) {
      const { title, unit, subLevel, module } = selection;
      return {
        title: title || 'Untitled Lesson',
        subtitle: `${subLevel || 'Level'} • Unit ${unit || '?'} • Module ${module || '?'}`
      }
    }
  }
};