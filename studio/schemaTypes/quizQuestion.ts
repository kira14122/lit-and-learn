export default {
  name: 'quizQuestion',
  type: 'document',
  title: 'Quiz Bank Questions',
  fields: [
    {
      name: 'question',
      title: 'The Question',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.required()
    },
    {
      name: 'questionFormat',
      title: 'Question Format',
      type: 'string',
      options: {
        list: ['Multiple Choice', 'True / False / Not Given'],
        layout: 'radio'
      },
      initialValue: 'Multiple Choice',
      validation: Rule => Rule.required()
    },
    {
      name: 'audioSnippet',
      title: '🎧 Listening Audio (Optional)',
      type: 'file',
      options: { accept: 'audio/*' }
    },
    {
      name: 'level',
      title: 'Level',
      type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] },
      validation: Rule => Rule.required()
    },
    {
      name: 'unit',
      title: 'Unit Number',
      type: 'number',
      validation: Rule => Rule.required().min(1).max(12)
    },
    {
      name: 'skill',
      title: 'Target Skill',
      type: 'string',
      options: { list: ['Grammar', 'Vocabulary', 'Reading', 'Listening', 'Writing'] },
      validation: Rule => Rule.required()
    },
    // The A/B/C/D fields will hide if you select TFNG!
    { name: 'optionA', title: 'Option A', type: 'string', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
    { name: 'optionB', title: 'Option B', type: 'string', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
    { name: 'optionC', title: 'Option C', type: 'string', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
    { name: 'optionD', title: 'Option D', type: 'string', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
    {
      name: 'correctAnswer',
      title: 'Which option is correct?',
      type: 'string',
      options: { list: ['A', 'B', 'C', 'D', 'True', 'False', 'Not Given'] },
      validation: Rule => Rule.required()
    },
    {
      name: 'explanation',
      title: 'Diagnostic Explanation',
      type: 'text',
      rows: 4
    },
    {
      name: 'relatedLesson',
      title: 'Related PDF/Audio Lesson (Optional)',
      type: 'reference',
      to: [{ type: 'resource' }]
    }
  ],
  preview: {
    select: {
      title: 'question',
      level: 'level',
      unit: 'unit',
      skill: 'skill',
      correct: 'correctAnswer',
      audio: 'audioSnippet'
    },
    prepare(selection) {
      const { title, level, unit, skill, correct, audio } = selection;
      return {
        title: title,
        subtitle: `${audio ? '🎧 ' : ''}${level} - Unit ${unit} (${skill}) | Answer: ${correct}`
      }
    }
  }
}