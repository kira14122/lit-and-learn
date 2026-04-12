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
      description: 'e.g., "Choose the correct tense to complete the sentence..."',
      validation: (Rule: any) => Rule.required()
    },
    // --- META TAGS (For the Balanced Shuffle) ---
    {
      name: 'level',
      title: 'Level',
      type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'unit',
      title: 'Unit Number',
      type: 'number',
      description: 'Which unit does this belong to? (1-12)',
      validation: (Rule: any) => Rule.required().min(1).max(12)
    },
    {
      name: 'skill',
      title: 'Target Skill',
      type: 'string',
      options: { list: ['Grammar', 'Vocabulary', 'Reading', 'Listening', 'Writing'] },
      validation: (Rule: any) => Rule.required()
    },
    // --- THE MULTIPLE CHOICE OPTIONS ---
    { name: 'optionA', title: 'Option A', type: 'string', validation: (Rule: any) => Rule.required() },
    { name: 'optionB', title: 'Option B', type: 'string', validation: (Rule: any) => Rule.required() },
    { name: 'optionC', title: 'Option C', type: 'string', validation: (Rule: any) => Rule.required() },
    { name: 'optionD', title: 'Option D', type: 'string', validation: (Rule: any) => Rule.required() },
    {
      name: 'correctAnswer',
      title: 'Which option is correct?',
      type: 'string',
      options: { list: ['A', 'B', 'C', 'D'], layout: 'radio' },
      validation: (Rule: any) => Rule.required()
    },
    // --- THE DIAGNOSTIC LOOP ---
    {
      name: 'explanation',
      title: 'Diagnostic Explanation',
      type: 'text',
      rows: 4,
      description: 'Why is the correct answer right, and why are the others wrong? This shows up if the student fails the question.'
    },
    {
      name: 'relatedLesson',
      title: 'Related PDF/Audio Lesson (Optional)',
      type: 'reference',
      to: [{ type: 'resource' }],
      description: 'Link this question to a specific lesson. If the student gets it wrong, we will give them a button to review this exact material.'
    }
  ],
  
  // Make it look clean in your dashboard list
  preview: {
    select: {
      title: 'question',
      level: 'level',
      unit: 'unit',
      skill: 'skill',
      correct: 'correctAnswer'
    },
    prepare(selection: any) {
      const { title, level, unit, skill, correct } = selection;
      return {
        title: title,
        subtitle: `${level} - Unit ${unit} (${skill}) | Answer: ${correct}`
      }
    }
  }
}