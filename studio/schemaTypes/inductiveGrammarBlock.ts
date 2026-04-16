export default {
  name: 'inductiveGrammarBlock',
  title: 'Inductive Grammar Block',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Grammar Topic',
      type: 'string',
      description: 'e.g., "Passive Voice" or "Reduced Relative Clauses"',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'noticingSentences',
      title: 'Phase 1: Context (Extract Sentences)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Paste 2-4 sentences directly from the reading passage that demonstrate the target grammar.',
      validation: (Rule) => Rule.required().min(1),
    },
    {
      name: 'noticingQuestions',
      title: 'Phase 2: Guided Discovery Questions',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Questions to make the student think BEFORE you give them the rule (e.g., "What is the focus of this sentence?").',
    },
    {
      name: 'grammarRule',
      title: 'Phase 3: The Rule (The Reveal)',
      type: 'text',
      rows: 5,
      description: 'The explicit explanation of the grammar rule and structure (e.g., "was/were + past participle").',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'quickCheck',
      title: 'Phase 4: Quick Check Quiz',
      type: 'array',
      description: 'Add a few multiple-choice questions to lock in the rule.',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'questionText',
              title: 'Question / Sentence with Blank',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'options',
              title: 'Multiple Choice Options',
              type: 'array',
              of: [{ type: 'string' }],
              validation: (Rule) => Rule.required().min(2),
            },
            {
              name: 'correctAnswer',
              title: 'Correct Answer',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
          ]
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare(selection) {
      return {
        title: `Grammar: ${selection.title || 'Topic'}`,
        subtitle: 'Inductive grammar lesson and quiz'
      }
    }
  }
};